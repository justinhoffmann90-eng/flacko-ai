import yahooFinance from 'yahoo-finance2';
try {
  const result = await yahooFinance.chart('TSLA', { 
    period1: new Date('2024-01-01'), 
    period2: new Date(), 
    interval: '1d' 
  });
  console.log('SUCCESS quotes:', result.quotes?.length);
} catch (e) {
  console.error('FAIL:', e.message?.slice(0, 150));
}
