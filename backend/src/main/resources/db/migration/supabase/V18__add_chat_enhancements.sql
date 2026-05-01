-- Add attachment support to direct_messages
ALTER TABLE direct_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Indexing for search performance (if we want to search content)
CREATE INDEX IF NOT EXISTS idx_direct_messages_content_trgm ON direct_messages USING gin (content gin_trgm_ops);
-- Note: Requires pg_trgm extension. If not available, we'll use a standard index or just rely on content search.
-- For now, a standard index is safer if I can't guarantee extensions.
CREATE INDEX IF NOT EXISTS idx_direct_messages_content ON direct_messages (content);
