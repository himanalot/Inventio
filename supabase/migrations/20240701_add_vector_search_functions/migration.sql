-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_input uuid
)
RETURNS TABLE (
  id uuid,
  document_path text,
  document_name text,
  page_number integer,
  chunk_index integer,
  text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_path,
    document_chunks.document_name,
    document_chunks.page_number,
    document_chunks.chunk_index,
    document_chunks.text,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 
    document_chunks.user_id = user_id_input
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 