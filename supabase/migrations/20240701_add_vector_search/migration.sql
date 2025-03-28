-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table for storing text chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_path TEXT NOT NULL,
  document_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS document_chunks_document_path_idx ON document_chunks(document_path);
CREATE INDEX IF NOT EXISTS document_chunks_user_id_idx ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS document_chunks_page_number_idx ON document_chunks(page_number);

-- Create a vector index for similarity search (using HNSW for better performance)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Set up Row Level Security (RLS)
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own document chunks
CREATE POLICY document_chunks_select_policy ON document_chunks
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own document chunks
CREATE POLICY document_chunks_insert_policy ON document_chunks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own document chunks
CREATE POLICY document_chunks_update_policy ON document_chunks
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own document chunks
CREATE POLICY document_chunks_delete_policy ON document_chunks
  FOR DELETE USING (auth.uid() = user_id);

-- Add cascade delete trigger to remove chunks when a chat conversation is deleted
CREATE OR REPLACE FUNCTION delete_document_chunks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM document_chunks WHERE document_path = OLD.document_path;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS delete_document_chunks_trigger ON chat_conversations;

-- Create trigger on chat_conversations table
CREATE TRIGGER delete_document_chunks_trigger
AFTER DELETE ON chat_conversations
FOR EACH ROW
EXECUTE FUNCTION delete_document_chunks();

-- Add a comment explaining the purpose of this table
COMMENT ON TABLE document_chunks IS 'Stores text chunks from documents with embeddings for semantic search'; 