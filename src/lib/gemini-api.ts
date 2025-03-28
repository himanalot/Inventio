import { usePdf } from "@anaralabs/lector";

// Maximum tokens to extract from PDF for context
const MAX_PDF_CONTEXT_TOKENS = 30000;

/**
 * Extract text from the loaded PDF document
 */
export async function extractPdfText(): Promise<string> {
  // This function needs to be called in a component context where usePdf is available
  // since we can't access the state outside of a React component
  throw new Error("This function must be called within a component with access to PDF state");
}

/**
 * Extract text from the loaded PDF document provided a document proxy
 */
export async function extractPdfTextFromProxy(pdfDocumentProxy: any): Promise<string> {
  if (!pdfDocumentProxy) {
    throw new Error("PDF not loaded");
  }

  console.log("=== EXTRACTING PDF TEXT ===");
  console.log("PDF Document Proxy available:", !!pdfDocumentProxy);
  
  try {
    // Get the number of pages
    const numPages = pdfDocumentProxy.numPages;
    console.log("PDF has", numPages, "pages");
    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      try {
        console.log(`Processing page ${i}...`);
        const page = await pdfDocumentProxy.getPage(i);
        const textContent = await page.getTextContent();
        
        console.log(`Page ${i} has ${textContent.items.length} text items`);
        
        // Process text items with better spacing
        let pageText = '';
        let lastY = null;
        let lastX = null;
        
        // Log a sample of text items for debugging
        if (i === 1 && textContent.items.length > 0) {
          console.log("Sample text items from first page:");
          console.log(textContent.items.slice(0, 5));
        }
        
        for (const item of textContent.items) {
          if (typeof item.str !== 'string') continue;
          
          // Add line breaks for significant Y position changes
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n';
          } 
          // Add space for X position gaps (words on same line)
          else if (lastX !== null && item.transform[4] > lastX + 10) {
            pageText += ' ';
          }
          
          pageText += item.str;
          lastY = item.transform[5];
          lastX = item.transform[4] + item.width;
        }
        
        fullText += `\n\nPage ${i}:\n${pageText}`;
        
        // Simple check to avoid exceeding token limits
        if (fullText.length > MAX_PDF_CONTEXT_TOKENS * 4) {
          console.log(`Reached content limit at page ${i}. Truncating content.`);
          fullText += `\n\n[Content truncated due to length]`;
          break;
        }
      } catch (error) {
        console.error(`Error extracting text from page ${i}:`, error);
      }
    }

    console.log(`Extracted ${fullText.length} characters of text from PDF`);
    console.log("First 200 characters:", fullText.substring(0, 200));
    console.log("=== PDF EXTRACTION COMPLETE ===");
    
    if (fullText.length < 100) {
      console.warn("WARNING: Extracted very little text from PDF. This may indicate an issue with the PDF or extraction process.");
    }

    return fullText;
  } catch (err) {
    console.error("Failed to extract PDF text:", err);
    throw err;
  }
}

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export class GeminiChatService {
  private apiKey: string;
  private apiUrl: string;
  private chatHistory: ChatMessage[] = [];
  private pdfContext: string = '';
  private isInitialized: boolean = false;
  private pdfData: ArrayBuffer | null = null;
  private initializationPromise: Promise<string> | null = null; // Track ongoing initialization

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  /**
   * Initialize the chat service with PDF content from the ArrayBuffer
   */
  async initializeWithPdfFile(pdfUrl: string, initialPrompt?: string) {
    try {
      // If we're already initialized, just return
      if (this.isInitialized) {
        console.log("=== GEMINI ALREADY INITIALIZED - SKIPPING ===");
        return "Already initialized";
      }
      
      // If there's already an initialization in progress, return that promise
      // This prevents duplicate API calls if initializeWithPdfFile is called multiple times
      if (this.initializationPromise) {
        console.log("=== GEMINI INITIALIZATION ALREADY IN PROGRESS - RETURNING EXISTING PROMISE ===");
        return this.initializationPromise;
      }
      
      // Create a new initialization promise
      this.initializationPromise = this._doInitialize(pdfUrl, initialPrompt);
      
      // Wait for initialization to complete
      const result = await this.initializationPromise;
      
      // Clear the promise after completion
      this.initializationPromise = null;
      
      return result;
    } catch (error) {
      // Clear the promise on error
      this.initializationPromise = null;
      console.error("Failed to initialize Gemini chat with PDF file:", error);
      throw error;
    }
  }
  
  /**
   * Internal method to actually perform the initialization
   * This is separated to allow for better promise tracking
   */
  private async _doInitialize(pdfUrl: string, initialPrompt?: string): Promise<string> {
    console.log("=== LOADING PDF FILE DIRECTLY FOR GEMINI API ===");
    console.log("PDF URL:", pdfUrl);
    
    // Fetch the PDF file from the URL
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    
    this.pdfData = await response.arrayBuffer();
    console.log("PDF file loaded, size:", this.pdfData.byteLength, "bytes");
    
    // For the initialization, we'll ask the model to analyze the PDF with the provided prompt or a default one
    const message = initialPrompt || "Please analyze this PDF document and summarize its main points.";
    console.log("Using initialization prompt:", message.substring(0, 100) + "...");
    
    // Send the PDF directly to the Gemini API
    const initialResponse = await this.sendWithPdf(message);
    
    // Mark as initialized
    this.isInitialized = true;
    console.log("=== GEMINI PDF INITIALIZATION COMPLETE ===");
    
    return initialResponse;
  }

  /**
   * Initialize the chat service with PDF context (text extraction method - legacy)
   */
  async initialize(pdfContent?: string) {
    try {
      // If PDF content is provided, use it; otherwise extract from current PDF
      this.pdfContext = pdfContent || await extractPdfText();
      
      // Add a system message with the PDF context
      this.chatHistory = [{
        role: 'user',
        content: this.pdfContext
      }];
      
      // Get first response from Gemini - asking for acknowledgment
      const response = await this.sendMessage('Can you summarize the main points of this text?', true);
      this.isInitialized = true;
      return response;
    } catch (error) {
      console.error('Failed to initialize Gemini chat with PDF context:', error);
      throw error;
    }
  }

  /**
   * Send a message to Gemini API with the PDF file directly
   * This uses the Gemini API's native PDF processing capabilities
   */
  async sendWithPdf(message: string): Promise<string> {
    if (!this.pdfData) {
      throw new Error('PDF file not loaded. Initialize with initializeWithPdfFile first.');
    }

    try {
      console.log('===== SENDING TO GEMINI API WITH PDF FILE =====');
      console.log('Message:', message);
      console.log('PDF size:', this.pdfData.byteLength, 'bytes');
      console.log('Chat history length:', this.chatHistory.length);
      
      // Convert PDF data to base64
      const pdfBase64 = this.arrayBufferToBase64(this.pdfData);
      
      // Track this message in chat history
      if (message) {
        this.chatHistory.push({
          role: 'user',
          content: message
        });
      }
      
      // Create the contents array for the API request
      const contents: Array<{role: string, parts: Array<{text?: string, inline_data?: {mime_type: string, data: string}}>}> = [];
      
      // If this is the first interaction, include current message with PDF in first message
      if (this.chatHistory.length <= 1) {
        contents.push({
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: pdfBase64
              }
            },
            { text: message }
          ]
        });
      } else {
        // For subsequent messages, we include the PDF in the first message
        // and then add the conversation history
        
        // First message is just the PDF (to establish context)
        contents.push({
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: pdfBase64
              }
            }
          ]
        });
        
        // Then add all messages from chat history
        for (let i = 0; i < this.chatHistory.length; i++) {
          const msg = this.chatHistory[i];
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }
      
      console.log('Contents being sent (with history):', JSON.stringify(contents.map(c => ({ 
        role: c.role, 
        parts: c.parts.map(p => p.text ? { text: p.text.substring(0, 50) + '...' } : { type: 'pdf_data' }) 
      })), null, 2));
      
      // Create the request body with the conversation history
      const requestBody = {
        contents: contents,
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };
      
      // Make API request
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';

      console.log('===== RECEIVED FROM GEMINI API =====');
      console.log('Response Text (first 200 chars):', responseText.substring(0, 200));
      console.log('====================================');

      // Add the response to chat history
      this.chatHistory.push({
        role: 'model',
        content: responseText
      });

      return responseText;
    } catch (error) {
      console.error('Error sending message with PDF to Gemini:', error);
      throw error;
    }
  }

  /**
   * Convert an ArrayBuffer to a base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Send a message to Gemini API
   */
  async sendMessage(message: string, isInitialization: boolean = false): Promise<string> {
    // If PDF data is available, prefer using the native PDF processing
    if (this.pdfData) {
      return this.sendWithPdf(message);
    }
    
    if (!isInitialization && !this.isInitialized) {
      throw new Error('Chat service not initialized with PDF context');
    }

    try {
      // Don't add user message if this is initialization (since we already added it)
      if (!isInitialization && message) {
        this.chatHistory.push({
          role: 'user',
          content: message
        });
      }

      // Simple conversation format for the API
      const contents = [];
      
      // Add the context as the first message
      if (this.chatHistory.length > 0) {
        const contextMessage = {
          role: 'user',
          parts: [{ text: this.chatHistory[0].content }]
        };
        contents.push(contextMessage);
      }
      
      // Add any response to the context setup
      if (this.chatHistory.length > 1) {
        const responseMessage = {
          role: 'model',
          parts: [{ text: this.chatHistory[1].content }]
        };
        contents.push(responseMessage);
      }
      
      // Add subsequent messages from chat history
      for (let i = 2; i < this.chatHistory.length; i++) {
        const msg = this.chatHistory[i];
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
      
      // Add the initialization question if needed
      if (isInitialization && message) {
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }

      // DEBUG: Log what's being sent to the API
      console.log('===== SENDING TO GEMINI API (sendMessage) =====');
      console.log('Message:', message);
      console.log('Is initialization:', isInitialization);
      console.log('PDF Context length:', this.pdfContext.length);
      console.log('First 200 chars of PDF context:', this.pdfContext.substring(0, 200));
      console.log('Contents being sent:', JSON.stringify(contents, null, 2).substring(0, 1000) + '...');
      console.log('Total number of messages:', contents.length);
      console.log('=============================================');

      // Make API request
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';

      // DEBUG: Log what we received
      console.log('===== RECEIVED FROM GEMINI API =====');
      console.log('Response Text (first 200 chars):', responseText.substring(0, 200));
      console.log('====================================');

      // Add the response to chat history
      this.chatHistory.push({
        role: 'model',
        content: responseText
      });

      return responseText;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw error;
    }
  }

  /**
   * Get the current chat history
   */
  getChatHistory(): ChatMessage[] {
    return this.chatHistory;
  }

  /**
   * Clear the chat history but keep the PDF context
   */
  resetChat(): void {
    this.chatHistory = [];
  }

  /**
   * Format PDF content for the API to ensure it's processed effectively
   */
  private formatPdfContent(pdfContent: string): string {
    // Limit content to a reasonable size
    const maxLength = 25000;
    let formattedContent = pdfContent;
    
    if (formattedContent.length > maxLength) {
      formattedContent = formattedContent.substring(0, maxLength) + 
        "\n\n[Content truncated due to length]";
    }
    
    // Return as plain text without labeling it as PDF
    return formattedContent;
  }

  /**
   * Send a message to Gemini API without requiring initialization
   * This is a simplified version that can work with or without PDF context
   */
  async sendSimpleMessage(message: string, pdfContent?: string): Promise<string> {
    // If PDF data is available, prefer using the native PDF processing
    if (this.pdfData) {
      return this.sendWithPdf(message);
    }
    
    try {
      // Format the message for the Gemini API
      let contents = [];
      
      // If PDF content is provided, include it as context
      if (pdfContent) {
        // Format the content
        const formattedContent = this.formatPdfContent(pdfContent);
        
        // DEBUG: Log PDF content details before sending
        console.log('===== SENDING TO GEMINI API (sendSimpleMessage) =====');
        console.log('Original PDF content length:', pdfContent.length);
        console.log('Formatted PDF content length:', formattedContent.length);
        console.log('First 200 chars of formatted PDF content:', formattedContent.substring(0, 200));
        console.log('User message:', message);
        
        // Simple approach - just combine the content and question
        contents.push({
          role: 'user',
          parts: [{ 
            text: `${formattedContent}\n\n${message}`
          }]
        });
      } else {
        // Simple direct question without context
        console.log('===== SENDING TO GEMINI API (sendSimpleMessage WITHOUT PDF) =====');
        console.log('WARNING: No PDF content provided for context');
        console.log('User message:', message);
        
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }

      // DEBUG: Log the final content being sent
      console.log('Contents being sent:', JSON.stringify(contents, null, 2).substring(0, 1000) + '...');
      console.log('=============================================');

      // Make API request with structured conversation
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.2,  // Lower temperature for more factual responses
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0]?.content?.parts[0]?.text || 'No response generated';

      // DEBUG: Log what we received
      console.log('===== RECEIVED FROM GEMINI API =====');
      console.log('Response Text (first 200 chars):', responseText.substring(0, 200));
      console.log('====================================');

      return responseText;
    } catch (error) {
      console.error('Error sending simple message to Gemini:', error);
      throw error;
    }
  }

  /**
   * Check if the chat service is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let geminiChatInstance: GeminiChatService | null = null;

/**
 * Get or create the Gemini chat service instance
 */
export function getGeminiChatService(apiKey: string): GeminiChatService {
  // Allow resetting the instance by checking window global
  if (typeof window !== 'undefined') {
    // Get instance from window if it exists
    let instance = (window as any).__GEMINI_CHAT_INSTANCE__;
    
    // Create new instance if needed
    if (!instance) {
      instance = new GeminiChatService(apiKey);
      // Store on window for reuse or resetting
      (window as any).__GEMINI_CHAT_INSTANCE__ = instance;
    }
    
    return instance;
  }
  
  // Fallback for non-browser environments
  if (!geminiChatInstance) {
    geminiChatInstance = new GeminiChatService(apiKey);
  }
  return geminiChatInstance;
} 