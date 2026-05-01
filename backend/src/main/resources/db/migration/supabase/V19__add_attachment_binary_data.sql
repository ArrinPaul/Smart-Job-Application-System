-- Add binary attachment data support
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_data BYTEA;

-- Comment for clarity
COMMENT ON COLUMN direct_messages.attachment_data IS 'Binary data for chat attachments (resumes, portfolios)';
