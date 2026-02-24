-- Add Discord message ID tracking to alert log
-- This allows us to delete/edit alert messages if needed
ALTER TABLE discord_alert_log
  ADD COLUMN IF NOT EXISTS discord_message_id TEXT,
  ADD COLUMN IF NOT EXISTS discord_channel_id  TEXT;

COMMENT ON COLUMN discord_alert_log.discord_message_id IS 'Discord message snowflake ID — enables delete/edit via bot API';
COMMENT ON COLUMN discord_alert_log.discord_channel_id  IS 'Discord channel ID the message was posted to';
