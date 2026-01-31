-- Add dashboard visit tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_dashboard_visit TIMESTAMPTZ DEFAULT NULL;

-- Add index for querying users who haven't visited
CREATE INDEX IF NOT EXISTS idx_users_last_dashboard_visit ON users(last_dashboard_visit);
