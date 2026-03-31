import { afterEach, beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';

import { makeTradeDecision, parseAlertAction } from '../decision-engine';
import type { ActiveStop, DailyReport, HIROData, MultiPortfolio, OrbData, Portfolio, TSLAQuote, V3State } from '../types';

const RealDate = Date;

beforeEach(() => {
  const fixed = new RealDate('2026-03-30T14:00:00-05:00');
  // @ts-ignore
  global.Date = class extends RealDate {
    constructor(value?: any) { super(value ?? fixed); }
    static now() { return fixed.getTime(); }
  } as DateConstructor;
});

afterEach(() => {
  // @ts-ignore
  global.Date = RealDate;
});

function quote(price: number, symbol = 'TSLA'): TSLAQuote {
  return { symbol, price, change: 0, changePercent: 0, volume: 1_000_000, open: price, high: price, low: price, previousClose: price, timestamp: new Date() };
}
function hiro(): HIROData { return { reading: 0, percentile30Day: 50, character: 'neutral', timestamp: new Date() }; }
function orb(): OrbData { return { score: 0, zone: 'NEUTRAL', activeSetups: [], timestamp: new Date() }; }
function report(overrides: Partial<DailyReport> = {}): DailyReport {
  return {
    date: '2026-03-30',
    mode: 'RED',
    tier: 1,
    masterEject: 345,
    gammaStrike: 360,
    putWall: 350,
    hedgeWall: 365,
    callWall: 410,
    daily_9ema: 355,
    daily_21ema: 360,
    weekly_9ema: 330,
    weekly_13ema: 338,
    weekly_21ema: 345,
    sma_200: 300,
    bx_daily_state: 'HL',
    levels: [],
    ...overrides,
  };
}
function multiPortfolio(overrides: Partial<MultiPortfolio> = {}): MultiPortfolio {
  return {
    cash: 1_000_000,
    startingCapital: 1_000_000,
    tsla: null,
    tsll: null,
    totalValue: 1_000_000,
    totalReturn: 0,
    totalReturnPercent: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    ...overrides,
  };
}
function portfolio(mp: MultiPortfolio): Portfolio {
  return {
    cash: mp.cash,
    startingCapital: mp.startingCapital,
    position: mp.tsla ? { shares: mp.tsla.shares, avgCost: mp.tsla.avgCost, entryTime: new Date(), entryPrice: mp.tsla.avgCost, unrealizedPnl: mp.tsla.unrealizedPnl, unrealizedPnlPercent: mp.tsla.pnlPercent, currentValue: mp.tsla.value } : null,
    totalValue: mp.totalValue,
    totalReturn: mp.totalReturn,
    totalReturnPercent: mp.totalReturnPercent,
    realizedPnl: mp.realizedPnl,
    unrealizedPnl: mp.unrealizedPnl,
  };
}
function v3(overrides: Partial<V3State> = {}): V3State {
  return {
    peakPositionValue: 500_000,
    dailyTrimPercent: 0,
    dailyTrimDate: '2026-03-30',
    lastBxFlipDate: null,
    previousBxState: 'HL',
    recoveryAccelRemaining: 0,
    consecutive_below_w21: 0,
    activeStops: [],
    firedLevelsToday: [],
    ...overrides,
  };
}
function context(opts: { price?: number; report?: DailyReport; multiPortfolio?: MultiPortfolio; v3State?: V3State; todayTradesCount?: number; orb?: any } = {}) {
  const q = quote(opts.price ?? 350);
  const mp = opts.multiPortfolio ?? multiPortfolio();
  if (mp.tsla) {
    mp.tsla.currentPrice = q.price;
    mp.tsla.value = mp.tsla.shares * q.price;
    mp.tsla.unrealizedPnl = mp.tsla.value - mp.tsla.shares * mp.tsla.avgCost;
    mp.tsla.pnlPercent = ((q.price / mp.tsla.avgCost) - 1) * 100;
  }
  return {
    quote: q,
    tsllQuote: quote(20, 'TSLL'),
    hiro: hiro(),
    report: opts.report ?? report(),
    orb: opts.orb ?? orb(),
    portfolio: portfolio(mp),
    multiPortfolio: mp,
    todayTradesCount: opts.todayTradesCount ?? 0,
    previousOrbZone: undefined,
    v3State: opts.v3State ?? v3(),
  };
}

test('1 parseAlertAction: buy with stop', () => {
  assert.deepEqual(parseAlertAction('Buy up to daily cap. Stop $340.'), { type: 'buy', useDailyCap: true, stopPrice: 340 });
});

test('2 parseAlertAction: trim with percent', () => {
  assert.deepEqual(parseAlertAction('Trim 30% of remaining'), { type: 'trim', trimPercent: 0.30 });
});

test('3 parseAlertAction: eject', () => {
  assert.deepEqual(parseAlertAction('All leverage cut. Master Eject confirmed.'), { type: 'eject' });
});

test('4 parseAlertAction: unknown empty', () => {
  assert.deepEqual(parseAlertAction('--'), { type: 'unknown' });
});

test('5 buy fires at nibble level', () => {
  const signal = makeTradeDecision(context({
    price: 350,
    report: report({ levels: [{ name: 'S1: Put Wall', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
  }));
  assert.equal(signal.action, 'buy');
  assert.equal(signal.instrument, 'TSLA');
  assert.equal(signal.stopPrice, 340);
});

test('6 stop loss fires', () => {
  const stop: ActiveStop = { id: '1', sourceLevel: 'S1', stopPrice: 340, sharesAtRisk: 100, createdAt: new Date().toISOString() };
  const signal = makeTradeDecision(context({
    price: 339,
    multiPortfolio: multiPortfolio({ tsla: { shares: 100, avgCost: 350, currentPrice: 339, value: 33900, unrealizedPnl: -1100, pnlPercent: -3.14 }, totalValue: 1_000_000 }),
    v3State: v3({ activeStops: [stop] }),
  }));
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 100);
});

test('7 trim fires at level regardless of pnl', () => {
  const signal = makeTradeDecision(context({
    price: 387,
    report: report({ mode: 'RED', levels: [{ name: 'T1: Trim Level', price: 387, type: 'trim', action: 'Trim 30% of remaining' }] }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 392, currentPrice: 387, value: 387000, unrealizedPnl: -5000, pnlPercent: -1.28 }, totalValue: 1_000_000 }),
  }));
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 300);
});

test('8 report trim percent used over mode cap subject to daily cap', () => {
  const signal = makeTradeDecision(context({
    price: 387,
    report: report({ mode: 'RED', levels: [{ name: 'T1', price: 387, type: 'trim', action: 'Trim 50% of remaining' }] }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 350, currentPrice: 387, value: 387000, unrealizedPnl: 37000, pnlPercent: 10.57 }, totalValue: 1_000_000 }),
  }));
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 300);
});

test('9 daily cap enforced', () => {
  const signal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'RED', levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
    multiPortfolio: multiPortfolio({ cash: 1_000_000, tsla: { shares: 114, avgCost: 350, currentPrice: 350, value: 39900, unrealizedPnl: 0, pnlPercent: 0 }, totalValue: 1_000_000 }),
  }));
  assert.equal(signal.action, 'buy');
  assert.equal(signal.shares, 28);
});

test('10 slow zone reduces cap', () => {
  const signal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'ORANGE', daily_21ema: 360, levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
  }));
  assert.equal(signal.action, 'buy');
  assert.equal(signal.shares, 71);
});

test('11 core hold floor blocks over-trim', () => {
  const signal = makeTradeDecision(context({
    price: 100,
    report: report({ putWall: 110, levels: [] }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 80, currentPrice: 100, value: 100000, unrealizedPnl: 20000, pnlPercent: 25 }, totalValue: 120000 }),
    v3State: v3({ peakPositionValue: 95000 }),
  }));
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 400);
});

test('12 max invested blocks entry', () => {
  const signal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'RED', levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 572, avgCost: 350, currentPrice: 350, value: 200200, unrealizedPnl: 0, pnlPercent: 0 }, totalValue: 1_000_000 }),
  }));
  assert.equal(signal.action, 'hold');
  assert.match(signal.reasoning.join(' '), /max invested/i);
});

test('13 EJECTED blocks entry', () => {
  const signal = makeTradeDecision(context({
    price: 350,
    report: report({ levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
    v3State: v3({ consecutive_below_w21: 2 }),
  }));
  assert.equal(signal.action, 'hold');
  assert.match(signal.reasoning.join(' '), /EJECTED mode active/i);
});

test('14 KL Step 4 trims', () => {
  const signal = makeTradeDecision(context({
    price: 340,
    report: report({ putWall: 350, levels: [] }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 2000, avgCost: 300, currentPrice: 340, value: 680000, unrealizedPnl: 80000, pnlPercent: 13.3 }, totalValue: 1_000_000 }),
  }));
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 529);
});

test('15 EMA extension trim', () => {
  const signal = makeTradeDecision(context({
    price: 345,
    report: report({ mode: 'ORANGE', weekly_9ema: 300, levels: [] }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 300, currentPrice: 345, value: 345000, unrealizedPnl: 45000, pnlPercent: 15 }, totalValue: 1_000_000 }),
  }));
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 250);
});

test('16 leverage only in GREEN and YI', () => {
  const redSignal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'RED', levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
  }));
  assert.equal(redSignal.action, 'buy');
  assert.equal(redSignal.instrument, 'TSLA');

  // GREEN + FULL_SEND orb → TSLL
  const greenSignal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'GREEN', weekly_21ema: 300, levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
    orb: { score: 0.8, zone: 'FULL_SEND' as any, activeSetups: [], timestamp: new Date() },
  }));
  assert.equal(greenSignal.action, 'buy');
  assert.equal(greenSignal.instrument, 'TSLL');

  // GREEN + NEUTRAL orb (no override) → TSLA
  const greenNeutralSignal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'GREEN', weekly_21ema: 300, levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
  }));
  assert.equal(greenNeutralSignal.action, 'buy');
  assert.equal(greenNeutralSignal.instrument, 'TSLA');

  // GREEN + NEUTRAL orb + Deep Value override → TSLL
  const greenOverrideSignal = makeTradeDecision(context({
    price: 350,
    report: report({ mode: 'GREEN', weekly_21ema: 300, levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
    orb: { score: 0, zone: 'NEUTRAL' as any, activeSetups: [{ setup_id: 'deep-value', status: 'active' }], timestamp: new Date() },
  }));
  assert.equal(greenOverrideSignal.action, 'buy');
  assert.equal(greenOverrideSignal.instrument, 'TSLL');
});

test('17 time cutoff', () => {
  const fixed = new RealDate('2026-03-30T15:30:00-05:00');
  // @ts-ignore
  global.Date = class extends RealDate { constructor(value?: any) { super(value ?? fixed); } static now() { return fixed.getTime(); } } as DateConstructor;
  const signal = makeTradeDecision(context({
    price: 350,
    report: report({ levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
  }));
  assert.equal(signal.action, 'hold');
  assert.match(signal.reasoning.join(' '), /after 3pm/i);
});

test('18 alert fires once per day', () => {
  const state = v3();
  const ctx = context({
    price: 350,
    report: report({ levels: [{ name: 'S1', price: 350, type: 'nibble', action: 'Buy up to daily cap. Stop $340.' }] }),
    v3State: state,
  });
  const first = makeTradeDecision(ctx);
  const second = makeTradeDecision(ctx);
  assert.equal(first.action, 'buy');
  assert.equal(second.action, 'hold');
});
