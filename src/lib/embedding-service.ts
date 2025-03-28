/**
 * Embedding Service
 * 
 * This service handles the generation and management of text embeddings for document chunks.
 * It uses text-embedding-3-small from OpenAI for creating embeddings that can be stored
 * and searched in the vector database.
 */

import OpenAI from 'openai';
import { DocumentChunk } from './chunking-service';
import { supabase } from './supabase';
import { Database } from '@/lib/database.types';

// Initialize OpenAI client with fallback to client-side key if server-side key is not available
// This allows the service to work in both server and client components
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow usage in browser environments
});

// Use the existing Supabase client from supabase.ts instead of creating a new one
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// 
// const supabase = createClient<Database>(
//   supabaseUrl,
//   supabaseServiceKey
// );

/**
 * Generate embeddings for document chunks and store them in the vector database
 */
export async function processAndStoreChunks(
  chunks: DocumentChunk[],
  userId: string
): Promise<void> {
  console.log(`Processing and storing ${chunks.length} document chunks for user ${userId}`);
  
  if (chunks.length === 0) {
    console.log('No chunks to process');
    return;
  }

  // Get the document path from the first chunk
  const documentPath = chunks[0].metadata.documentPath;
  
  try {
    // First, delete any existing chunks for this document to avoid conflicts
    console.log(`Removing existing chunks for document: ${documentPath}`);
    await deleteDocumentChunks(documentPath, userId);
    console.log(`Successfully deleted existing chunks`);
  } catch (error) {
    console.error('Error deleting existing chunks:', error);
    // Continue with processing even if deletion fails
  }
  
  // Process chunks in batches to avoid rate limits and reduce API calls
  const batchSize = 20; // OpenAI allows up to 2048 embeddings per request, but smaller batches are safer
  const batches = [];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push(chunks.slice(i, i + batchSize));
  }
  
  console.log(`Processing chunks in ${batches.length} batches`);
  
  // Process each batch
  for (const [batchIndex, batch] of batches.entries()) {
    try {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);
      
      // Generate embeddings for the batch
      const embeddings = await generateEmbeddings(batch.map(chunk => chunk.text));
      
      if (!embeddings || embeddings.length !== batch.length) {
        console.error(`Error: Expected ${batch.length} embeddings, got ${embeddings?.length || 0}`);
        continue;
      }
      
      // Prepare data for storage
      const chunkData = batch.map((chunk, index) => ({
        user_id: userId,
        document_path: chunk.metadata.documentPath,
        document_name: chunk.metadata.documentName,
        page_number: chunk.pageNumber,
        chunk_index: chunk.chunkIndex,
        text: chunk.text,
        chunk_size: chunk.text.length,
        metadata: chunk.metadata,
        embedding: embeddings[index],
      }));
      
      // Store chunks in the vector database using insert instead of upsert
      const { error } = await supabase
        .from('document_chunks')
        .insert(chunkData);
        // No longer using upsert since we deleted existing chunks
        // .upsert(chunkData, {
        //   onConflict: 'document_path,chunk_index,user_id',
        //   ignoreDuplicates: false,
        // });
      
      if (error) {
        console.error('Error storing document chunks:', error);
        throw error;
      }
      
      console.log(`Successfully stored batch ${batchIndex + 1}`);
    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
      // Continue with next batch despite errors
    }
  }
  
  console.log('Finished processing and storing all document chunks');
}

/**
 * Generate embeddings for an array of text strings
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    if (!texts.length) return [];
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single query text
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

/**
 * Search for relevant document chunks based on query embedding
 */
export async function searchRelevantChunks(
  queryEmbedding: number[],
  userId: string,
  documentPath?: string,
  limit: number = 5,
  similarityThreshold: number = 0.2 // Lowered from 0.7 for more lenient matching
): Promise<any[]> {
  try {
    console.log('Searching chunks with params:', {
      userId,
      documentPath: documentPath || 'any',
      limit,
      similarityThreshold
    });

    // Build query with match_documents RPC
    let query = supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: limit,
        user_id_input: userId
      });
    
    // Filter by document path if provided
    // This is done after the vector search since we have a btree index on document_path
    if (documentPath) {
      query = query.eq('document_path', documentPath);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error searching for relevant chunks:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} relevant chunks`);
    if (data?.length > 0) {
      console.log('Top match similarity:', data[0].similarity);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchRelevantChunks:', error);
    throw error;
  }
}

/**
 * Delete all document chunks associated with a document path
 */
export async function deleteDocumentChunks(
  documentPath: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_path', documentPath)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting document chunks:', error);
      throw error;
    }
    
    console.log(`Successfully deleted chunks for document ${documentPath}`);
  } catch (error) {
    console.error('Error in deleteDocumentChunks:', error);
    throw error;
  }
} 