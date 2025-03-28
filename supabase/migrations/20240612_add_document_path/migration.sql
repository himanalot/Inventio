-- Add document_path column to chat_conversations table
ALTER TABLE IF EXISTS chat_conversations
ADD COLUMN IF NOT EXISTS document_path TEXT;

-- Populate the document_path column for existing records
-- Extract the path portion from the document_url (remove any query parameters)
UPDATE chat_conversations
SET document_path = SPLIT_PART(document_url, '?', 1)
WHERE document_path IS NULL;

-- Create an index on document_path for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_document_path ON chat_conversations(document_path);

-- Add a comment explaining the purpose of this column
COMMENT ON COLUMN chat_conversations.document_path IS 'A stable identifier for the document, not affected by URL changes or expirations'; 