import { supabase } from './supabase';
import { getFileDownloadUrl } from './file-service';
import { generateQueryEmbedding, searchRelevantChunks } from './embedding-service';

// Gemini API configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Update the import at the top to include the new parameter type
type SearchOptions = {
  limit?: number;
  similarityThreshold?: number;
};

/**
 * Processes a user query about a document using Gemini with RAG enhancement
 * @param documentPath The path of the document in storage
 * @param userQuery The user's question
 * @param previousMessages Optional array of previous conversation messages for context
 */
export async function processDocumentQuery(
  documentPath: string,
  userQuery: string,
  previousMessages: { role: 'user' | 'assistant', content: string }[] = []
): Promise<{text: string; citations?: {text: string; position: any}[]}> {
  try {
    console.log('\n[RAG Process Started] ----------------');
    console.log('Document Path:', documentPath);
    console.log('User Query:', userQuery);
    console.log('Previous Messages Count:', previousMessages.length);

    if (!GEMINI_API_KEY) {
      console.error('[RAG Error] Gemini API key not configured');
      return {
        text: "I'm sorry, but the AI service is not properly configured. Please contact support."
      };
    }
    
    // Extract user ID from the document path (first segment)
    const userId = documentPath.split('/')[0];
    console.log('User ID extracted:', userId);
    
    // Get relevant chunks using vector search if available
    console.log('\n[Vector Search] Fetching relevant chunks...');
    const relevantChunks = await getRelevantChunks(userQuery, userId, documentPath);
    const hasRelevantChunks = relevantChunks && relevantChunks.length > 0;
    
    console.log('Chunks found:', relevantChunks.length);
    if (hasRelevantChunks) {
      console.log('Sample chunks:');
      relevantChunks.slice(0, 2).forEach((chunk, i) => {
        console.log(`Chunk ${i + 1}:`, {
          pageNumber: chunk.page_number,
          textPreview: chunk.text.substring(0, 100) + '...',
          score: chunk.similarity_score
        });
      });
    }
    
    // Format previous messages for context
    const messageHistory = previousMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    // Format relevant chunks for the prompt
    let relevantPassages = '';
    if (hasRelevantChunks) {
      relevantPassages = 'Here are relevant passages from the document:\n\n';
      
      relevantChunks.forEach((chunk, index) => {
        relevantPassages += `PASSAGE ${index + 1} [Page ${chunk.page_number}]:\n${chunk.text}\n\n`;
      });
    }
    
    console.log('\n[Approach Selection]');
    console.log('Using combined approach with both RAG and full document');
    
    // Use the combined approach that leverages both RAG and full document
    const response = await generateCombinedResponse(documentPath, userQuery, messageHistory, relevantChunks);
    console.log('\n[Combined Response Generated]');
    console.log('Response length:', response.text.length);
    return response;
  } catch (error) {
    console.error('\n[RAG Process Error]:', error);
    return {
      text: `I'm sorry, but I encountered an error while trying to answer your question: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    console.log('[RAG Process Completed] ----------------\n');
  }
}

/**
 * Generate a response using RAG (retrieved chunks only)
 */
async function generateResponseWithRAG(
  userQuery: string,
  relevantPassages: string,
  messageHistory: string,
  relevantChunks: any[] = []
): Promise<{text: string; citations?: {text: string; position: any}[]}> {
  try {
    // Format instructions for Gemini to emphasize citation requirements
    const systemPrompt = `
You are an AI research assistant analyzing academic documents. Answer the user's question based on the provided document passages and previous conversation history.

${messageHistory ? 'CONVERSATION HISTORY:\n' + messageHistory + '\n\n' : ''}

RELEVANT DOCUMENT PASSAGES:
${relevantPassages}

USER QUERY: "${userQuery}"

RESPONSE GUIDELINES:
1. Base your response ONLY on the provided document passages and conversation history. Do not include external knowledge.
2. Maintain a scholarly tone suitable for academic research assistance.
3. When citing information, use a simple page number in parentheses, like this: (page 3).
4. Provide page numbers for all factual claims directly from the document.
5. Place citations at the end of sentences before the period (page 5).
6. You can reference multiple pages in one citation if needed (pages 3-4).
7. Be precise and thorough in your analysis.
8. If you're unsure or the passages don't contain relevant information, acknowledge this limitation.
9. Always maintain context from the conversation history when responding.
10. Start with a direct answer to the query, then provide supporting evidence.

RESPONSE STRUCTURE:
- Begin with a direct answer to the user's question
- Support claims with evidence from the passages, with appropriate page citations
- Organize information logically and clearly
- End with a summary or conclusion
- Suggest 1-2 relevant follow-up questions if appropriate

Write a comprehensive, accurate response that synthesizes information from the provided passages.
`;
    
    // Create request for Gemini
    const model = "gemini-2.0-flash"; // Consider pro version for more complex tasks
    const requestBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt }
          ],
          role: "user"
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    };
    
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    // Extract response text
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    
    // Process response text to remove any "References" section that might have been generated
    let processedText = responseText;
    const referencesPattern = /\n\n(References|Sources|Citations|Bibliography)[\s\S]*$/i;
    processedText = processedText.replace(referencesPattern, '');
    
    // Still track page numbers for internal use but don't return citations for display
    const pageNumberRegex = /\(page(?:s)? (\d+(?:-\d+)?)\)/g;
    let match;
    let pageNumbers = new Set<number>();
    
    while ((match = pageNumberRegex.exec(processedText)) !== null) {
      const pageRef = match[1];
      
      if (pageRef.includes('-')) {
        const [start, end] = pageRef.split('-').map(num => parseInt(num));
        for (let i = start; i <= end; i++) {
          pageNumbers.add(i);
        }
      } else {
        pageNumbers.add(parseInt(pageRef));
      }
    }
    
    console.log(`Response references ${pageNumbers.size} unique pages: ${Array.from(pageNumbers).join(', ')}`);
    
    // Return the response without citations UI elements
    return {
      text: processedText
    };
  } catch (error) {
    console.error('Error generating response with RAG:', error);
    return {
      text: "I apologize, but I encountered an error analyzing the document. Please try again or rephrase your question."
    };
  }
}

/**
 * Generate a response using the full document (fallback approach)
 */
async function generateResponseWithFullDocument(
  documentPath: string,
  userQuery: string,
  messageHistory: string
): Promise<string> {
  try {
    // Get the document URL
    const documentUrl = await getFileDownloadUrl(documentPath);
    
    // Fetch the document as an ArrayBuffer
    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }
    
    const documentArrayBuffer = await response.arrayBuffer();
    const documentBytes = new Uint8Array(documentArrayBuffer);
    
    // Convert to base64
    const base64Document = arrayBufferToBase64(documentBytes);
    
    // Construct system prompt for full document approach
    const systemPrompt = `
You are an AI research assistant analyzing academic documents. Answer the user's question based on the provided PDF document and previous conversation history.

${messageHistory ? 'CONVERSATION HISTORY:\n' + messageHistory + '\n\n' : ''}

USER QUERY: "${userQuery}"

RESPONSE GUIDELINES:
1. Base your response ONLY on the PDF document and conversation history. Do not include external knowledge.
2. Maintain a scholarly tone suitable for academic research assistance.
3. When citing information, use a simple page number in parentheses, like this: (page 3).
4. Provide page numbers for all factual claims directly from the document.
5. Place citations at the end of sentences before the period (page 5).
6. You can reference multiple pages in one citation if needed (pages 3-4).
7. Be precise and thorough in your analysis.
8. If you're unsure or cannot find information in the document, acknowledge this limitation.
9. Always maintain context from the conversation history when responding.

RESPONSE STRUCTURE:
- Begin with a direct answer to the user's question
- Support claims with evidence from the document, with appropriate page citations
- Organize information logically and clearly
- End with a summary or conclusion
- Suggest 1-2 relevant follow-up questions if appropriate

Write a comprehensive, accurate response that addresses the user's query.
    `;
    
    // Make the API request
    const apiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Document
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Gemini API error (${apiResponse.status}): ${errorText}`);
    }
    
    const data = await apiResponse.json();
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      // Get the response text and clean up any references section
      let responseText = data.candidates[0].content.parts[0].text;
      const referencesPattern = /\n\n(References|Sources|Citations|Bibliography)[\s\S]*$/i;
      responseText = responseText.replace(referencesPattern, '');
      
      return responseText;
    } else {
      console.error('Unexpected Gemini API response format:', JSON.stringify(data));
      return "I'm sorry, but I encountered an issue processing your question. Please try again.";
    }
  } catch (error) {
    console.error('Error in generateResponseWithFullDocument:', error);
    throw error;
  }
}

/**
 * Get relevant chunks from the document using vector search
 */
async function getRelevantChunks(
  query: string,
  userId: string,
  documentPath: string,
  limit: number = 15,
  similarityThreshold: number = 0.2 // Lowered from 0.7 to be more lenient
): Promise<any[]> {
  try {
    console.log('\n[Vector Search Started] =====================');
    console.log('Input Parameters:', {
      query: query,
      userId: userId,
      documentPath: documentPath,
      limit: limit,
      similarityThreshold: similarityThreshold
    });

    // Generate embedding for the query
    console.log('\n[Embedding Generation]');
    console.log('Generating query embedding...');
    let queryEmbedding;
    try {
      queryEmbedding = await generateQueryEmbedding(query);
      console.log('✓ Query embedding generated successfully');
      console.log('Embedding dimensions:', queryEmbedding.length);
    } catch (embeddingError) {
      console.error('✗ Failed to generate query embedding:', embeddingError);
      throw embeddingError;
    }
    
    // Search for relevant chunks
    console.log('\n[Chunk Search]');
    console.log('Searching for chunks with parameters:', {
      userId: userId,
      documentPath: documentPath,
      limit: limit,
      similarityThreshold: similarityThreshold,
      embeddingSize: queryEmbedding.length
    });

    let relevantChunks;
    try {
      relevantChunks = await searchRelevantChunks(
        queryEmbedding,
        userId,
        documentPath,
        limit,
        similarityThreshold
      );
      console.log('✓ Search completed successfully');
    } catch (searchError) {
      console.error('✗ Failed to search chunks:', searchError);
      throw searchError;
    }
    
    console.log('\n[Search Results]');
    console.log('Total chunks found:', relevantChunks.length);
    
    if (relevantChunks.length > 0) {
      console.log('Top 3 chunks by similarity:');
      relevantChunks.slice(0, 3).forEach((chunk, i) => {
        console.log(`\nChunk ${i + 1}:`);
        console.log('- Page:', chunk.page_number);
        console.log('- Similarity score:', chunk.similarity_score);
        console.log('- Text preview:', chunk.text.substring(0, 100) + '...');
        console.log('- Metadata:', chunk.metadata || 'None');
      });
    } else {
      console.log('⚠️ No chunks found. Possible reasons:');
      console.log('1. Document not properly chunked/embedded');
      console.log(`2. Similarity threshold (${similarityThreshold}) might still be too high`);
      console.log('3. Query too dissimilar from document content');
      console.log('4. Database connection issues');
      
      // If no chunks found with current threshold, we could try an even lower threshold
      if (similarityThreshold > 0.2) {
        console.log('\n[Retrying with lower threshold]');
        return getRelevantChunks(query, userId, documentPath, limit + 2, 0.1);
      }
    }
    
    console.log('\n[Vector Search Completed] =====================');
    return relevantChunks;
  } catch (error) {
    console.error('\n[Vector Search Failed] =====================');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    console.log('Falling back to full document approach');
    return [];
  }
}

/**
 * Helper function to convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  if (buffer instanceof ArrayBuffer) {
    buffer = new Uint8Array(buffer);
  }
  
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Generate a response using both RAG and full document approaches combined
 * @param documentPath The path of the document in storage
 * @param userQuery The user's question
 * @param messageHistory Previous conversation messages formatted as a string
 * @param relevantChunks Array of relevant chunks from vector search
 * @returns Promise with the generated response
 */
async function generateCombinedResponse(
  documentPath: string,
  userQuery: string,
  messageHistory: string,
  relevantChunks: any[] = []
): Promise<{text: string; citations?: {text: string; position: any}[]}> {
  try {
    console.log('\n[Combined Approach Started] ----------------');
    
    // Get the document URL
    const documentUrl = await getFileDownloadUrl(documentPath);
    
    // Fetch the document as an ArrayBuffer
    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }
    
    const documentArrayBuffer = await response.arrayBuffer();
    const documentBytes = new Uint8Array(documentArrayBuffer);
    
    // Convert to base64
    const base64Document = arrayBufferToBase64(documentBytes);
    
    // Format relevant chunks for the prompt
    let relevantPassages = '';
    if (relevantChunks && relevantChunks.length > 0) {
      relevantPassages = 'Here are relevant passages from the document that may help answer the query:\n\n';
      
      relevantChunks.forEach((chunk, index) => {
        relevantPassages += `PASSAGE ${index + 1} [Page ${chunk.page_number}]:\n${chunk.text}\n\n`;
      });
    }
    
    // Construct system prompt that combines both approaches
    const systemPrompt = `
You are an AI research assistant analyzing academic documents. Answer the user's question based on the provided PDF document, relevant passages, and previous conversation history. The amount of relevant passages will vary based on the query.

${messageHistory ? 'CONVERSATION HISTORY:\n' + messageHistory + '\n\n' : ''}

${relevantPassages ? 'RELEVANT DOCUMENT PASSAGES:\n' + relevantPassages + '\n\n' : ''}

USER QUERY: "${userQuery}"

RESPONSE GUIDELINES:
1. Base your response ONLY on the PDF document, relevant passages, and conversation history. Do not include external knowledge.
2. Maintain a scholarly tone suitable for academic research assistance.
3. When citing information, use a simple page number in parentheses, like this: (page 3).
4. Provide page numbers for all factual claims directly from the document.
5. Place citations at the end of sentences before the period (page 5).
6. You can reference multiple pages in one citation if needed (pages 3-4).
7. Double check all citations, even ones from the relevant passages, with the pdf document to verify their accuracy.
8. Be precise and thorough in your analysis.
9. If you're unsure or cannot find information in the document, acknowledge this limitation.
10. Always maintain context from the conversation history when responding.
11. Pay special attention to the relevant passages provided, as they are likely to contain information directly related to the query.

RESPONSE STRUCTURE:
- Begin with a direct answer to the user's question
- Support claims with evidence from the document, with appropriate page citations
- Organize information logically and clearly
- End with a summary or conclusion

Write a comprehensive, accurate response that addresses the user's query.
    `;
    
    // Make the API request
    const apiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64Document
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Gemini API error (${apiResponse.status}): ${errorText}`);
    }
    
    const data = await apiResponse.json();
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      // Get the response text and clean up any references section
      let responseText = data.candidates[0].content.parts[0].text;
      const referencesPattern = /\n\n(References|Sources|Citations|Bibliography)[\s\S]*$/i;
      responseText = responseText.replace(referencesPattern, '');
      
      console.log('\n[Combined Response Generated]');
      console.log('Response length:', responseText.length);
      
      return { text: responseText };
    } else {
      console.error('Unexpected Gemini API response format:', JSON.stringify(data));
      return { 
        text: "I'm sorry, but I encountered an issue processing your question. Please try again."
      };
    }
  } catch (error) {
    console.error('\n[Combined Approach Error]:', error);
    return {
      text: `I'm sorry, but I encountered an error while trying to answer your question: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    console.log('[Combined Approach Completed] ----------------\n');
  }
}
