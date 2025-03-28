-- Add unique constraint for document_chunks table
-- This is needed for the upsert operation in the embedding service

-- First, create a unique index on the combination of document_path, chunk_index, and user_id
CREATE UNIQUE INDEX IF NOT EXISTS document_chunks_path_index_user_idx 
ON document_chunks(document_path, chunk_index, user_id);

-- Add a constraint that references this index
ALTER TABLE document_chunks 
ADD CONSTRAINT document_chunks_path_index_user_key 
UNIQUE USING INDEX document_chunks_path_index_user_idx; 