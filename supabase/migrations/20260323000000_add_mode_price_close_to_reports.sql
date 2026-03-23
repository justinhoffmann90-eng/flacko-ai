-- Add mode and price_close as top-level columns to reports table
-- Previously these were only stored inside extracted_data JSON

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS price_close NUMERIC(10, 2);

-- Backfill from extracted_data for existing rows
UPDATE reports
SET
  mode = UPPER(extracted_data->'mode'->>'current'),
  price_close = (extracted_data->'price'->>'close')::NUMERIC
WHERE mode IS NULL
  AND extracted_data IS NOT NULL;
