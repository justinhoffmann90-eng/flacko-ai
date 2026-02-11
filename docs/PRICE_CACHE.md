# Price Cache System

## Overview

Shared cache for TSLA and TSLL prices to prevent Yahoo Finance rate limiting across multiple systems (paper trader, alerts, etc.).

## Architecture

### API Endpoint: `/api/price-cache`

**GET** (public) - Returns cached prices from Supabase
```bash
curl https://www.flacko.ai/api/price-cache
```

Response:
```json
{
  "TSLA": {
    "symbol": "TSLA",
    "price": 234.56,
    "change": -2.34,
    "change_percent": -0.99,
    "volume": 123456789,
    "high": 236.00,
    "low": 233.00,
    "previous_close": 236.90,
    "updated_at": "2026-02-11T19:45:00Z"
  },
  "TSLL": { ... },
  "cached_at": "2026-02-11T19:45:30Z"
}
```

**POST** (auth required) - Refreshes cache from Yahoo Finance
```bash
curl -X POST https://www.flacko.ai/api/price-cache \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Database Table

Run the migration:
```bash
psql $DATABASE_URL < supabase/migrations/price_cache_table.sql
```

Or via Supabase dashboard SQL editor:
```sql
CREATE TABLE IF NOT EXISTS price_cache (
  symbol TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  change NUMERIC,
  change_percent NUMERIC,
  volume BIGINT,
  high NUMERIC,
  low NUMERIC,
  previous_close NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_cache_updated_at ON price_cache(updated_at);
```

### Cron Schedule

Vercel Cron (in `vercel.json`):
- **Every 5 minutes** during market hours (9:30 AM - 4:00 PM ET / 14:30-21:00 UTC)
- **Monday-Friday only**
- Schedule: `*/5 14-21 * * 1-5`

The cron automatically calls `POST /api/price-cache` with the `CRON_SECRET` from Vercel environment.

### Cache TTL

- **5 minutes** - Cache is considered fresh within this window
- Paper trader tries cache first, falls back to direct Yahoo API if stale or unavailable

## Usage

### Paper Trader (TypeScript)

```typescript
import { fetchTSLAPrice, fetchTSLLPrice } from './data-feed';

// Automatically tries cache first, falls back to Yahoo
const tsla = await fetchTSLAPrice();
const tsll = await fetchTSLLPrice();
```

### Other Systems (Python)

```python
import requests

def get_cached_price(symbol: str) -> dict | None:
    """Fetch price from cache API."""
    try:
        resp = requests.get('https://www.flacko.ai/api/price-cache')
        resp.raise_for_status()
        data = resp.json()
        return data.get(symbol)
    except Exception as e:
        print(f"Cache fetch failed: {e}")
        return None

# Example
tsla = get_cached_price('TSLA')
if tsla and is_fresh(tsla['updated_at']):
    price = tsla['price']
else:
    # Fallback to direct Yahoo API
    price = fetch_from_yahoo('TSLA')
```

## Benefits

1. **Rate limit prevention** - Single source of Yahoo Finance calls
2. **Consistency** - All systems see the same price at the same time
3. **Performance** - Cached responses are faster than Yahoo API
4. **Reliability** - Fallback chain ensures availability

## Monitoring

Check cache health:
```bash
# View recent cache updates
psql $DATABASE_URL -c "SELECT * FROM price_cache ORDER BY updated_at DESC;"

# Check cache staleness
psql $DATABASE_URL -c "
  SELECT symbol, 
         price, 
         updated_at,
         EXTRACT(EPOCH FROM (NOW() - updated_at)) as age_seconds
  FROM price_cache;
"
```

## Environment Variables

Required in Vercel:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (not anon key)
- `CRON_SECRET` - Shared secret for cron auth
- `NEXT_PUBLIC_SITE_URL` - Site URL (for cache API calls)
