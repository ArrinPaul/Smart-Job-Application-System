-- Update direct_messages table for binary attachments
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_data BYTEA;

-- Comments for clarity
COMMENT ON COLUMN direct_messages.attachment_data IS 'Binary data for chat attachments (resumes, portfolios)';
