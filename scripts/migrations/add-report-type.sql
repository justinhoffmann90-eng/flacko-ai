-- Add report_type column to reports table
-- Default value is 'daily' for existing rows
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'daily';

-- Update the weekly report from 2026-02-14
UPDATE reports 
SET report_type = 'weekly' 
WHERE report_date = '2026-02-14';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
