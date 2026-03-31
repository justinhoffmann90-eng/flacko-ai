import { afterEach, beforeEach, test } from 'node:test';
import * as assert from 'node:assert/strict';

import { makeTradeDecision } from '../decision-engine';
import type { DailyReport, HIROData, MultiPortfolio, OrbData, Portfolio, TSLAQuote, V3State } from '../types';

const RealDate = Date;

beforeEach(() => {
  const fixed = new RealDate('2026-03-30T14:00:00-05:00');
  // @ts-ignore
  global.Date = class extends RealDate {
    constructor(value?: any) {
      super(value ?? fixed);
    }
    static now() {
      return fixed.getTime();
    }
  } as DateConstructor;
});

afterEach(() => {
  // @ts-ignore
  global.Date = RealDate;
});

function quote(price: number): TSLAQuote {
  return {
    symbol: 'TSLA',
    price,
    change: 0,
    changePercent: 0,
    volume: 1_000_000,
    open: price,
    high: price,
    low: price,
    previousClose: price,
    timestamp: new Date('2026-03-30T19:00:00Z'),
  };
}

function hiro(): HIROData {
  return {
    reading: 0,
    percentile30Day: 50,
    character: 'neutral',
    timestamp: new Date('2026-03-30T19:00:00Z'),
  };
}

function orb(): OrbData {
  return {
    score: 0.1,
    zone: 'NEUTRAL',
    activeSetups: [],
    timestamp: new Date('2026-03-30T19:00:00Z'),
  };
}

function report(overrides: Partial<DailyReport> = {}): DailyReport {
  return {
    date: '2026-03-30',
    mode: 'ORANGE',
    tier: 1,
    masterEject: 340,
    gammaStrike: 360,
    putWall: 350,
    hedgeWall: 380,
    callWall: 420,
    daily_9ema: 370,
    daily_21ema: 360,
    weekly_9ema: 330,
    weekly_13ema: 340,
    weekly_21ema: 345,
    sma_200: 300,
    bx_daily_state: 'HL',
    levels: [],
    ...overrides,
  };
}

function multiPortfolio(overrides: Partial<MultiPortfolio> = {}): MultiPortfolio {
  return {
    cash: 600_000,
    startingCapital: 1_000_000,
    tsla: {
      shares: 1000,
      avgCost: 392,
      currentPrice: 387,
      value: 387_000,
      unrealizedPnl: -5_000,
      pnlPercent: -1.28,
    },
    tsll: null,
    totalValue: 1_000_000,
    totalReturn: 0,
    totalReturnPercent: 0,
    realizedPnl: 0,
    unrealizedPnl: -5_000,
    ...overrides,
  };
}

function portfolio(mp: MultiPortfolio): Portfolio {
  return {
    cash: mp.cash,
    startingCapital: mp.startingCapital,
    position: mp.tsla
      ? {
          shares: mp.tsla.shares,
          avgCost: mp.tsla.avgCost,
          entryTime: new Date('2026-03-01T19:00:00Z'),
          entryPrice: mp.tsla.avgCost,
          unrealizedPnl: mp.tsla.unrealizedPnl,
          unrealizedPnlPercent: mp.tsla.pnlPercent,
          currentValue: mp.tsla.value,
        }
      : null,
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
    ...overrides,
  };
}

function context(opts: {
  price?: number;
  tsllPrice?: number;
  report?: DailyReport;
  multiPortfolio?: MultiPortfolio;
  v3State?: V3State;
  orb?: OrbData;
  todayTradesCount?: number;
} = {}): any {
  const q = quote(opts.price ?? 387);
  const mp = opts.multiPortfolio ?? multiPortfolio();
  if (mp.tsla) {
    mp.tsla.currentPrice = q.price;
    mp.tsla.value = mp.tsla.shares * q.price;
    mp.tsla.unrealizedPnl = mp.tsla.value - (mp.tsla.shares * mp.tsla.avgCost);
    mp.tsla.pnlPercent = (q.price / mp.tsla.avgCost - 1) * 100;
  }
  return {
    quote: q,
    tsllQuote: quote(opts.tsllPrice ?? 20),
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

test('trim fires on losing position', () => {
  const ctx = context({
    price: 387,
    report: report({
      levels: [{ name: 'D21 EMA', price: 387, type: 'trim' }],
      daily_21ema: 360,
      weekly_9ema: 380,
      weekly_13ema: 390,
      weekly_21ema: 400,
    }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'sell');
  assert.equal(signal.instrument, 'TSLA');
  assert.ok((signal.shares ?? 0) > 0);
});

test('extension trim at 15% fires at mode rate', () => {
  const ctx = context({
    price: 345,
    report: report({ mode: 'ORANGE', levels: [], daily_21ema: 300, weekly_9ema: 300, weekly_13ema: 290, weekly_21ema: 280, gammaStrike: 200 }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 300, currentPrice: 345, value: 345000, unrealizedPnl: 45000, pnlPercent: 15 } }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 250);
});

test('extension trim suppressed in GREEN at exactly 12%', () => {
  const ctx = context({
    price: 336,
    report: report({ mode: 'GREEN', levels: [], daily_21ema: 300, weekly_9ema: 300, weekly_13ema: 290, weekly_21ema: 280, gammaStrike: 400 }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 300, currentPrice: 336, value: 336000, unrealizedPnl: 36000, pnlPercent: 12 } }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'hold');
});

test('extension trim at 18% overrides GREEN suppression', () => {
  const ctx = context({
    price: 354,
    report: report({ mode: 'GREEN', levels: [], daily_21ema: 300, weekly_9ema: 300, weekly_13ema: 290, weekly_21ema: 280, gammaStrike: 400 }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 1000, avgCost: 300, currentPrice: 354, value: 354000, unrealizedPnl: 54000, pnlPercent: 18 } }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 100);
});

test('EJECTED mode after 2 closes below W21 blocks buys except oversold override', () => {
  const ctx = context({
    price: 355,
    report: report({ mode: 'EJECTED', levels: [{ name: 'S1', price: 355, type: 'support' }], sma_200: 300 }),
    multiPortfolio: multiPortfolio({ tsla: null, unrealizedPnl: 0 }),
    v3State: v3({ consecutive_below_w21: 2, peakPositionValue: 0 }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'hold');
  assert.match(signal.reasoning.join(' '), /EJECTED mode active/i);
});

test('EJECTED to ORANGE recovery uses ORANGE behavior when counter reset', () => {
  const ctx = context({
    price: 359,
    report: report({ mode: 'ORANGE', levels: [{ name: 'S1', price: 359, type: 'support' }], daily_21ema: 370, weekly_9ema: 380, weekly_13ema: 390, weekly_21ema: 395, sma_200: 300, gammaStrike: 390, callWall: 420 }),
    multiPortfolio: multiPortfolio({ tsla: null, unrealizedPnl: 0 }),
    v3State: v3({ consecutive_below_w21: 0, peakPositionValue: 0 }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'buy');
  assert.equal(signal.instrument, 'TSLA');
});

test('KL Step 4 trims TSLA to 50%', () => {
  const ctx = context({
    price: 340,
    report: report({ putWall: 350, levels: [], daily_21ema: 300, weekly_9ema: 280, weekly_13ema: 270, weekly_21ema: 260 }),
    multiPortfolio: multiPortfolio({
      tsla: { shares: 2000, avgCost: 300, currentPrice: 340, value: 680000, unrealizedPnl: 80000, pnlPercent: 13.33 },
      totalValue: 1_000_000,
    }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'sell');
  assert.equal(signal.instrument, 'TSLA');
  assert.equal(signal.shares, 529);
});

test('KL Step 4 respects Core Hold Floor', () => {
  const ctx = context({
    price: 100,
    report: report({ putWall: 110, levels: [], daily_21ema: 90, weekly_9ema: 80, weekly_13ema: 75, weekly_21ema: 70 }),
    multiPortfolio: multiPortfolio({
      tsla: { shares: 1000, avgCost: 80, currentPrice: 100, value: 100000, unrealizedPnl: 20000, pnlPercent: 25 },
      totalValue: 120000,
    }),
    v3State: v3({ peakPositionValue: 95000 }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'sell');
  assert.equal(signal.shares, 400);
});

test('Slow Zone in RED uses 25% of normal cap', () => {
  const ctx = context({
    price: 350,
    report: report({ mode: 'RED', levels: [{ name: 'S1', price: 350, type: 'support' }], daily_21ema: 360, weekly_9ema: 380, weekly_13ema: 390, weekly_21ema: 400, gammaStrike: 390, callWall: 430 }),
    multiPortfolio: multiPortfolio({ tsla: { shares: 286, avgCost: 340, currentPrice: 350, value: 100100, unrealizedPnl: 2860, pnlPercent: 2.94 }, totalValue: 1_000_000 }),
    v3State: v3({ peakPositionValue: 100100 }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'buy');
  assert.equal(signal.shares, 21);
});

test('Slow Zone in GREEN is inactive', () => {
  const ctx = context({
    price: 350,
    report: report({ mode: 'GREEN', levels: [{ name: 'S1', price: 350, type: 'support' }], daily_21ema: 360, weekly_9ema: 380, weekly_13ema: 390, weekly_21ema: 400, gammaStrike: 420, callWall: 450 }),
    multiPortfolio: multiPortfolio({ tsla: null, unrealizedPnl: 0 }),
    v3State: v3({ peakPositionValue: 0 }),
  });
  const signal = makeTradeDecision(ctx);
  assert.equal(signal.action, 'buy');
  assert.equal(signal.shares, 514);
});

test('MAX_INVESTED blocks entry but does not force exit', () => {
  const entryCtx = context({
    price: 360,
    report: report({ mode: 'RED', levels: [{ name: 'S1', price: 360, type: 'support' }], daily_21ema: 370, weekly_9ema: 380, weekly_13ema: 390, weekly_21ema: 400 }),
    multiPortfolio: multiPortfolio({
      tsla: { shares: 1667, avgCost: 300, currentPrice: 360, value: 600120, unrealizedPnl: 100020, pnlPercent: 20 },
      totalValue: 1_000_000,
    }),
  });
  const entrySignal = makeTradeDecision(entryCtx);
  assert.equal(entrySignal.action, 'hold');
  assert.equal(entrySignal.action, 'hold');
  assert.notEqual(entrySignal.action, 'buy');

  const exitCtx = context({
    price: 360,
    report: report({ mode: 'RED', levels: [], daily_21ema: 370, weekly_9ema: 380, weekly_13ema: 390, weekly_21ema: 400 }),
    multiPortfolio: multiPortfolio({
      tsla: { shares: 1667, avgCost: 300, currentPrice: 360, value: 600120, unrealizedPnl: 100020, pnlPercent: 20 },
      totalValue: 1_000_000,
    }),
  });
  const exitSignal = makeTradeDecision(exitCtx);
  assert.equal(exitSignal.action, 'hold');
  assert.doesNotMatch(exitSignal.reasoning.join(' '), /MAX INVESTED/i);
});
