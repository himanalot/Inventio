import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { createChatConversation } from './chat-service';
import { processPdfDocument } from './chunking-service';
import { processAndStoreChunks, deleteDocumentChunks } from './embedding-service';

// Bucket name in Supabase Storage
const BUCKET_NAME = 'pdfs';

// Gemini API endpoint and configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Gemini prompts
const GEMINI_PROMPTS = {
  summary: `
    Analyze this PDF document and provide a comprehensive, detailed summary in a single paragraph of 4-6 sentences.
    
    Focus on including:
    - Specific details, statistics, and facts from the document
    - Context about organizations, locations, or settings mentioned
    - Key achievements, qualifications, or metrics if applicable
    - Any evaluative observations based on the document content
    - A concluding statement about the broader significance
    
    DO NOT include:
    - Introductory phrases like "This document" or "The PDF"
    - Any prefixes like "Summary:" or "Document overview:"
    - Any formatting (bold, italic, etc.)
    
    Start directly with the substance of the document.
    Make the summary flow naturally as a cohesive paragraph.
  `,
  questions: `
    Based on the document, generate 5 short, simple questions that focus on:
    1. Practical applications of this information
    2. Why this information matters
    3. Future implications
    4. Impact on key stakeholders
    5. Connection to broader trends
    
    Keep questions brief and direct. Avoid complex wording or unnecessarily long questions.
    
    IMPORTANT: Return ONLY the plain questions without any prefixes, labels, or numbers. Do not include "Practical:", "Importance:", or similar labels before questions. Just output the 5 questions directly, one per line.
  `,
  metadata: `
    Extract the following metadata from this PDF document and return a valid JSON object.
    
    RESPONSE FORMAT INSTRUCTIONS:
    1. Your response must be ONLY the JSON object itself
    2. DO NOT wrap the JSON in code blocks (no \`\`\` markers)
    3. DO NOT add any explanatory text before or after the JSON
    4. The response MUST start with { and end with }
    5. Make sure it's valid JSON that can be parsed with JSON.parse()
    
    JSON STRUCTURE:
    {
      "title": "The full title of the document",
      "authors": "Authors names, comma separated",
      "publication": "Journal or publication name",
      "volume": "Volume number if applicable",
      "issue": "Issue number if applicable",
      "pages": "Page range (e.g., 123-145)",
      "issue_date": "Publication date in YYYY-MM-DD format if available",
      "doi": "Digital Object Identifier if present",
      "issn": "ISSN if present",
      "url": "URL if mentioned in the document",
      "abstract": "The document's abstract or a brief description (3-5 sentences)"
    }
    
    If any field is not found in the document, include the key with an empty string value.
    For the abstract, provide a concise paragraph that captures the essence of the document.
    
    CRITICAL: Your entire response should be parseable as JSON. No text outside the JSON structure.
  `,
  // New combined prompt that extracts everything in one call
  combined: `
    Analyze this PDF document and extract the following information in a SINGLE JSON object.
    
    RESPONSE FORMAT REQUIREMENTS:
    1. Your response must be ONLY the JSON object itself
    2. DO NOT wrap the JSON in code blocks (no \`\`\` markers)
    3. DO NOT add any explanatory text before or after the JSON
    4. The response MUST start with { and end with }
    5. Make sure it's valid JSON that can be parsed with JSON.parse()
    
    JSON STRUCTURE:
    {
      "metadata": {
        "title": "The full title of the document",
        "authors": "Authors names, comma separated",
        "publication": "Journal or publication name",
        "volume": "Volume number if applicable",
        "issue": "Issue number if applicable",
        "pages": "Page range (e.g., 123-145)",
        "issue_date": "Publication date in YYYY-MM-DD format if available",
        "doi": "Digital Object Identifier if present",
        "issn": "ISSN if present",
        "url": "URL if mentioned in the document",
        "abstract": "The document's abstract (3-5 sentences)"
      },
      "summary": "A comprehensive, detailed summary in a single paragraph of 4-6 sentences, focusing on specific details, context about organizations/locations, key achievements/metrics, and concluding with broader significance.",
      "questions": [
        "Question 1 about practical applications",
        "Question 2 about why this information matters",
        "Question 3 about future implications",
        "Question 4 about impact on key stakeholders",
        "Question 5 about connection to broader trends"
      ]
    }
    
    INSTRUCTIONS FOR EACH SECTION:
    - For metadata: If any field is not found, include the key with an empty string value.
    - For summary: Do NOT use introductory phrases like "This document" or "The PDF" or any prefixes.
    - For questions: Keep questions brief and direct. Avoid complex wording or unnecessarily long questions.
    
    CRITICAL: Your entire response must be a SINGLE, properly formatted JSON object that can be directly parsed. No text outside the JSON structure.
  `
};

// Helper function to clean text from all potential code block markers
const cleanTextOutput = (text: string): string => {
  if (!text) return text;
  
  // First check if the entire text is wrapped in quotes and unwrap it
  let cleanedText = text;
  if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
    console.log("Response wrapped in double quotes, unwrapping");
    try {
      // Try to parse it as a JSON string first (handles escape sequences properly)
      cleanedText = JSON.parse(cleanedText);
      console.log("Successfully unwrapped text using JSON.parse");
    } catch (e) {
      // If JSON parsing fails, do manual unwrapping
      cleanedText = cleanedText.substring(1, cleanedText.length - 1);
      // Unescape escaped quotes within the string
      cleanedText = cleanedText.replace(/\\"/g, '"');
      console.log("Manually unwrapped text from double quotes");
    }
  }
  
  // Now remove ALL backticks, triple backticks, and any code block indicators
  cleanedText = cleanedText
    .replace(/```json/g, '') // Remove json code block start markers
    .replace(/```/g, '')     // Remove any triple backticks code block markers
    .replace(/`/g, '')       // Remove any single backticks
    .replace(/^json\s*/i, '') // Remove 'json' text at beginning
    .trim();
    
  console.log("Cleaned text sample:", cleanedText.substring(0, 50));
  return cleanedText;
};

export interface FileObject {
  id: string;
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

/**
 * List all files for the current user
 */
export async function listUserFiles(userId: string): Promise<FileObject[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/`);

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    // Map storage objects to FileObjects
    const files: FileObject[] = data.map(file => ({
      id: file.id,
      name: file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at,
      updated_at: file.updated_at,
      url: supabase.storage.from(BUCKET_NAME).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
      path: `${userId}/${file.name}`,
      type: file.metadata?.mimetype || 'application/pdf' // Default to PDF if not specified
    }));

    return files;
  } catch (error) {
    console.error('Error in listUserFiles:', error);
    return [];
  }
}

/**
 * Checks if a file with the same name already exists for the user
 */
async function fileExists(userId: string, fileName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/`);

    if (error) {
      console.error('Error checking for existing files:', error);
      return false;
    }

    return data.some(file => file.name === fileName);
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(userId: string, file: File): Promise<FileObject> {
  try {
    // Sanitize the original filename by removing special characters
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Check if a file with this name already exists
    const exists = await fileExists(userId, sanitizedFileName);
    if (exists) {
      throw new Error('A file with this name already exists. Please rename your file before uploading.');
    }
    
    // Ensure the path is properly formatted
    const filePath = `${userId}/${sanitizedFileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload file to storage
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Upload failed: No data returned');
    }

    // Get signed URL with long expiry instead of public URL
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 60 * 60 * 24); // 24 hours expiry
      
    if (signedUrlError) {
      console.error('Error getting signed URL after upload:', signedUrlError);
      throw signedUrlError;
    }

    // Return file object
    try {
      const fileObject: FileObject = {
        id: data.path,
        name: sanitizedFileName,
        url: signedUrlData.signedUrl,
        path: data.path,
        type: file.type,
        size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Return file object without creating a conversation
      return fileObject;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * Also deletes any associated chat conversations, messages, and document chunks
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    // Extract user ID from the file path
    const userId = filePath.split('/')[0];
    
    // First, delete any document chunks associated with this document path
    try {
      await deleteDocumentChunks(filePath, userId);
      console.log('Successfully deleted document chunks for:', filePath);
    } catch (chunkError) {
      console.error('Error deleting document chunks:', chunkError);
      // Continue with other deletions even if chunks deletion fails
    }
    
    // Next, delete any conversations associated with this document path
    // The chat_messages will be automatically deleted due to ON DELETE CASCADE
    const { error: convError } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('document_path', filePath);
    
    if (convError) {
      console.error('Error deleting associated conversations:', convError);
      // Continue with file deletion even if conversation deletion fails
    } else {
      console.log('Successfully deleted associated conversations for:', filePath);
    }
    
    // Then delete the file from storage
    const { error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }
    
    console.log('Successfully deleted file:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get a downloadable URL for a file
 * This ensures we always get a fresh, working URL even if signed URLs expire
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  try {
    console.log('Getting download URL for file path:', filePath);
    
    // Generate a signed URL with longer expiry
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      
    if (error) {
      console.error('Error generating download URL:', error);
      throw error;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file download URL:', error);
    throw error;
  }
}

/**
 * Generate combined document information using a single Gemini API call
 * Returns metadata, summary, and questions in one structured object
 */
async function generateCombinedDocumentInfo(pdfBytes: Uint8Array): Promise<{
  metadata: {
    title: string;
    authors: string;
    publication: string;
    volume: string;
    issue: string;
    pages: string;
    issue_date: string;
    doi: string;
    issn: string;
    url: string;
    abstract: string;
    date?: string;
  };
  summary: string;
  questions: string[];
}> {
  // Default values
  const defaultResponse = {
    metadata: {
      title: '',
      authors: '',
      publication: '',
      volume: '',
      issue: '',
      pages: '',
      issue_date: '',
      doi: '',
      issn: '',
      url: '',
      abstract: '',
      date: new Date().toISOString().split('T')[0]
    },
    summary: '',
    questions: []
  };

  try {
    // Make a single API call with the combined prompt
    const responseJson = await generateGeminiContentFromPdf(pdfBytes, GEMINI_PROMPTS.combined);
    
    if (!responseJson) {
      console.warn('Empty response from Gemini API, using default values');
      return defaultResponse;
    }
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(responseJson);
    console.log('Successfully extracted combined document info');
    
    // Ensure all required fields exist with proper types
    const result = {
      metadata: {
        ...defaultResponse.metadata,
        ...parsedResponse.metadata,
        // Always ensure date field exists
        date: parsedResponse.metadata?.issue_date || 
              parsedResponse.metadata?.date || 
              defaultResponse.metadata.date
      },
      summary: parsedResponse.summary || defaultResponse.summary,
      questions: Array.isArray(parsedResponse.questions) ? 
        parsedResponse.questions.filter((q: any) => q && typeof q === 'string') : 
        defaultResponse.questions
    };
    
    // Sanitize all string fields in metadata
    Object.entries(result.metadata).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        (result.metadata as any)[key] = '';
      } else if (typeof value === 'string') {
        (result.metadata as any)[key] = value.trim();
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error generating combined document info:', error);
    return defaultResponse;
  }
}

/**
 * Upload a file and create an AI conversation for it
 * This function:
 * 1. Uploads the file to Supabase
 * 2. Processes the PDF for chunking and embedding
 * 3. Generates a summary and questions using Gemini's native PDF processing
 * 4. Creates a conversation in the database
 */
export async function uploadFileWithGemini(userId: string, file: File): Promise<{ fileObject: FileObject; conversationId: string | null }> {
  try {
    // First upload the file to Supabase
    const fileObject = await uploadFile(userId, file);
    
    if (!fileObject) {
      throw new Error('File upload failed');
    }
    
    // Read the file content for processing
    const fileContent = await file.arrayBuffer();
    
    // Start PDF processing for RAG in the background
    processPdfForRag(fileContent, fileObject.path, fileObject.name, userId)
      .catch(error => console.error('Error in background RAG processing:', error));
    
    console.log(`Starting Gemini processing for document: ${fileObject.name}`);
    
    // Use the new combined API call approach
    const documentInfo = await generateCombinedDocumentInfo(new Uint8Array(fileContent));
    
    console.log(`Completed Gemini processing for document: ${fileObject.name}`);
    console.log(`Summary length: ${documentInfo.summary?.length || 0} characters`);
    console.log(`Extracted ${documentInfo.questions.length} questions`);
    
    // Extract the filename as title (without .pdf extension)
    const filenameTitle = fileObject.name.replace(/\.pdf$/i, '');
    
    // Override title if it's empty or unavailable
    if (!documentInfo.metadata.title || 
        documentInfo.metadata.title.trim() === '' || 
        documentInfo.metadata.title === 'Unavailable') {
      documentInfo.metadata.title = filenameTitle;
    }
    
    // Hardcoded quick actions - always use these regardless of what's in the database
    const hardcodedQuickActions = ['breakdown', 'practice questions', 'study guide'];
    
    // Create a conversation with metadata in the database
    const metadata = { 
      documentInfo: documentInfo.metadata
    };
    
    // Create a conversation in the database
    const conversation = await createChatConversation(
      userId,
      fileObject.url,
      fileObject.name,
      `Chat about ${fileObject.name}`,
      fileObject.path, // Use the stable path as the document identifier
      documentInfo.summary,
      documentInfo.questions,
      hardcodedQuickActions, // Always use our hardcoded quick actions
      metadata // Add the metadata
    );
    
    return {
      fileObject,
      conversationId: conversation?.id || null
    };
  } catch (error) {
    console.error('Error in uploadFileWithGemini:', error);
    throw error;
  }
}

/**
 * Process a PDF file for RAG (Retrieval Augmented Generation)
 * This runs in the background after file upload and:
 * 1. Extracts and chunks text from the PDF
 * 2. Generates embeddings for each chunk
 * 3. Stores chunks and embeddings in the vector database
 */
async function processPdfForRag(
  pdfArrayBuffer: ArrayBuffer,
  documentPath: string,
  documentName: string,
  userId: string
): Promise<void> {
  try {
    console.log(`Starting RAG processing for document: ${documentPath}`);
    
    // Process the PDF to extract chunks
    const startTime = Date.now();
    const chunks = await processPdfDocument(pdfArrayBuffer, documentPath, documentName);
    const chunkingTime = Date.now() - startTime;
    
    console.log(`PDF processed in ${chunkingTime}ms. Generated ${chunks.length} chunks.`);
    
    // Store chunks and generate embeddings in the database
    await processAndStoreChunks(chunks, userId);
    
    const totalProcessingTime = Date.now() - startTime;
    console.log(`RAG processing complete for ${documentPath}. Total time: ${totalProcessingTime}ms`);
  } catch (error) {
    console.error(`Error processing PDF for RAG: ${documentPath}`, error);
    // Don't throw - this is a background process and should not affect the main upload
  }
}

/**
 * Generate content using the Gemini API with direct PDF input
 * This leverages Gemini's native PDF understanding capabilities
 */
async function generateGeminiContentFromPdf(pdfBytes: Uint8Array, prompt: string): Promise<string> {
  let retries = 0;
  const maxRetries = 2;
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  async function attemptApiCall(): Promise<string> {
    try {
      if (!GEMINI_API_KEY) {
        console.error('Gemini API key not configured');
        return "API key not configured";
      }
      
      // Convert the PDF bytes to base64
      const base64Pdf = arrayBufferToBase64(pdfBytes);
      
      // Construct the request with the PDF as inline data
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: base64Pdf
                  }
                },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        })
      });
      
      // Check if we need to retry (rate limit or server error)
      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text();
        
        // If rate limited (429) or server error (5xx), try again with exponential backoff
        if ((status === 429 || status >= 500) && retries < maxRetries) {
          retries++;
          const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s
          console.log(`Gemini API error (${status}). Retrying in ${backoffTime/1000}s... (Attempt ${retries}/${maxRetries})`);
          await delay(backoffTime);
          return await attemptApiCall();
        }
        
        throw new Error(`Gemini API error (${status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Clean the response text using the cleanTextOutput helper function
        const cleanedText = cleanTextOutput(rawText);
        console.log(`Cleaned Gemini response for prompt type: ${prompt.substring(0, 20)}...`);
        
        return cleanedText;
      } else {
        console.error('Unexpected Gemini API response format:', JSON.stringify(data));
        return "Error: Unexpected API response format";
      }
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      
      // If we have retries left and it's a network error, retry
      if (retries < maxRetries && error instanceof Error && error.message.includes('network')) {
        retries++;
        const backoffTime = Math.pow(2, retries) * 1000;
        console.log(`Network error with Gemini API. Retrying in ${backoffTime/1000}s... (Attempt ${retries}/${maxRetries})`);
        await delay(backoffTime);
        return await attemptApiCall();
      }
      
      return `Error generating content: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  return attemptApiCall();
}

/**
 * Helper function to convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
} 