/**
 * Chunking Service
 * 
 * This service handles the extraction and chunking of text from PDF documents.
 * It ensures that the document is broken down into meaningful, overlapping chunks
 * that maintain context and can be used for semantic search.
 */

import * as pdfjs from 'pdfjs-dist';
import { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Set worker path for PDF.js
const WORKER_SRC = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

// Interface for a chunk of text from a document
export interface DocumentChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
  metadata: {
    documentPath: string;
    documentName: string;
    pageNumber: number;
    sectionTitle?: string;
    isTable?: boolean;
    // Position information for highlighting
    position?: {
      boundingRect: {
        pageNumber: number;
        left: number;
        top: number;
        width: number;
        height: number;
      };
      textRanges?: {
        pageNumber: number;
        left: number;
        top: number;
        width: number;
        height: number;
      }[];
    };
  };
}

/**
 * Process a PDF document and extract text chunks with position information
 */
export async function processPdfDocument(
  pdfArrayBuffer: ArrayBuffer,
  documentPath: string,
  documentName: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): Promise<DocumentChunk[]> {
  try {
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: pdfArrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    console.log(`Processing PDF with ${numPages} pages`);
    
    // Extract text from each page with structure and position preservation
    const pagesText: { 
      text: string; 
      pageNumber: number; 
      items: any[]; 
      positions: {
        text: string;
        pageNumber: number;
        left: number;
        top: number;
        width: number;
        height: number;
        transform: number[];
      }[] 
    }[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Process text content to maintain structure
      let pageText = '';
      let lastY = null;
      const positions: {
        text: string;
        pageNumber: number;
        left: number;
        top: number;
        width: number;
        height: number;
        transform: number[];
        textIndex: number; // Start index in the pageText string
      }[] = [];
      
      // Convert text items to structured text with position data
      let currentTextIndex = 0;
      
      for (const item of textContent.items) {
        const textItem = item as TextItem;
        
        // Check if this is a new line based on Y position
        if (lastY !== null && Math.abs(textItem.transform[5] - lastY) > 5) {
          pageText += '\n';
          currentTextIndex += 1;
        } else if (textItem.hasEOL) {
          pageText += ' ';
          currentTextIndex += 1;
        }
        
        // Store position data
        positions.push({
          text: textItem.str,
          pageNumber: i,
          left: textItem.transform[4],
          top: textItem.transform[5],
          width: textItem.width || 0,
          height: textItem.height || (lastY !== null ? Math.abs(textItem.transform[5] - lastY) : 10),
          transform: [...textItem.transform],
          textIndex: currentTextIndex
        });
        
        pageText += textItem.str;
        currentTextIndex += textItem.str.length;
        lastY = textItem.transform[5];
      }
      
      pagesText.push({ 
        text: pageText, 
        pageNumber: i,
        items: textContent.items,
        positions: positions
      });
    }
    
    // Identify potential section headers for better chunking
    const sectionHeaders = identifySectionHeaders(pagesText);
    
    // Create chunks from the extracted text with position information
    const chunks = createChunksWithPositions(pagesText, documentPath, documentName, chunkSize, chunkOverlap, sectionHeaders);
    
    return chunks;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

/**
 * Identify potential section headers in the document
 */
function identifySectionHeaders(pagesText: { text: string; pageNumber: number; items: any[] }[]): { text: string; pageNumber: number; index: number }[] {
  const headers: { text: string; pageNumber: number; index: number }[] = [];
  
  // Simple heuristic: lines that are shorter than 80 chars, end with no punctuation, and followed by a newline
  pagesText.forEach(page => {
    const lines = page.text.split('\n');
    
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      // Check if line could be a header:
      // 1. Not too long (less than 80 chars)
      // 2. Does not end with typical sentence punctuation
      // 3. Not empty
      if (
        trimmedLine.length > 0 && 
        trimmedLine.length < 80 && 
        !trimmedLine.match(/[.,:;!?]$/) &&
        // Heuristic - often headers are in ALL CAPS or Title Case
        (trimmedLine === trimmedLine.toUpperCase() || 
         trimmedLine.split(' ').every(word => word.length > 0 && word[0] === word[0].toUpperCase()))
      ) {
        headers.push({
          text: trimmedLine,
          pageNumber: page.pageNumber,
          index: idx
        });
      }
    });
  });
  
  return headers;
}

/**
 * Create text chunks with position information
 */
function createChunksWithPositions(
  pagesText: { text: string; pageNumber: number; items: any[]; positions: any[] }[],
  documentPath: string,
  documentName: string,
  chunkSize: number,
  chunkOverlap: number,
  sectionHeaders: { text: string; pageNumber: number; index: number }[]
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;
  
  // Process each page
  pagesText.forEach(page => {
    const pageText = page.text;
    const pageNumber = page.pageNumber;
    const positions = page.positions;
    
    // Get headers for this page
    const pageHeaders = sectionHeaders.filter(h => h.pageNumber === pageNumber);
    
    // If we have headers, chunk by section
    if (pageHeaders.length > 0) {
      // Split the page text into lines
      const lines = pageText.split('\n');
      
      // Process each section
      for (let i = 0; i < pageHeaders.length; i++) {
        const currentHeader = pageHeaders[i];
        const nextHeader = pageHeaders[i + 1];
        
        // Determine section text
        let sectionStart = currentHeader.index;
        let sectionEnd = nextHeader ? nextHeader.index : lines.length;
        let sectionText = lines.slice(sectionStart, sectionEnd).join('\n');
        
        // Find the character offsets of this section in the original text
        let charStart = 0;
        for (let j = 0; j < sectionStart; j++) {
          charStart += lines[j].length + 1; // +1 for the newline
        }
        
        let charEnd = charStart + sectionText.length;
        
        // Create chunks from this section
        const sectionChunks = splitTextIntoChunks(
          sectionText, 
          chunkSize, 
          chunkOverlap
        );
        
        // Add section chunks with metadata and position information
        let chunkOffset = 0;
        
        sectionChunks.forEach(chunkText => {
          // Find the start and end position in the original text
          const chunkStartInSection = sectionText.indexOf(chunkText, chunkOffset);
          const chunkEndInSection = chunkStartInSection + chunkText.length;
          
          // Convert to overall document position
          const chunkStartInDocument = charStart + chunkStartInSection;
          const chunkEndInDocument = charStart + chunkEndInSection;
          
          // Find text positions that fall within this chunk
          const chunkPositions = positions.filter(pos => {
            const posStartIndex = pos.textIndex;
            const posEndIndex = posStartIndex + pos.text.length;
            return (
              posStartIndex >= chunkStartInDocument && posStartIndex < chunkEndInDocument
            ) || (
              posEndIndex > chunkStartInDocument && posEndIndex <= chunkEndInDocument
            );
          });
          
          // Calculate bounding rectangle for this chunk
          const boundingRect = calculateBoundingRect(chunkPositions);
          
          chunks.push({
            text: chunkText,
            pageNumber,
            chunkIndex: chunkIndex++,
            metadata: {
              documentPath,
              documentName,
              pageNumber,
              sectionTitle: currentHeader.text,
              isTable: containsTable(chunkText),
              position: {
                boundingRect: {
                  pageNumber,
                  left: boundingRect.left,
                  top: boundingRect.top,
                  width: boundingRect.width,
                  height: boundingRect.height
                },
                textRanges: chunkPositions.map(pos => ({
                  pageNumber,
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height
                }))
              }
            }
          });
          
          // Update offset for next chunk search
          chunkOffset = chunkStartInSection + chunkText.length;
        });
      }
    } else {
      // No headers, chunk the page directly
      const pageChunks = splitTextIntoChunks(pageText, chunkSize, chunkOverlap);
      
      // Add page chunks with metadata and position information
      let chunkOffset = 0;
      
      pageChunks.forEach(chunkText => {
        // Find the start and end position in the original text
        const chunkStartInPage = pageText.indexOf(chunkText, chunkOffset);
        const chunkEndInPage = chunkStartInPage + chunkText.length;
        
        // Find text positions that fall within this chunk
        const chunkPositions = positions.filter(pos => {
          const posStartIndex = pos.textIndex;
          const posEndIndex = posStartIndex + pos.text.length;
          return (
            posStartIndex >= chunkStartInPage && posStartIndex < chunkEndInPage
          ) || (
            posEndIndex > chunkStartInPage && posEndIndex <= chunkEndInPage
          );
        });
        
        // Calculate bounding rectangle for this chunk
        const boundingRect = calculateBoundingRect(chunkPositions);
        
        chunks.push({
          text: chunkText,
          pageNumber,
          chunkIndex: chunkIndex++,
          metadata: {
            documentPath,
            documentName,
            pageNumber,
            isTable: containsTable(chunkText),
            position: {
              boundingRect: {
                pageNumber,
                left: boundingRect.left,
                top: boundingRect.top,
                width: boundingRect.width,
                height: boundingRect.height
              },
              textRanges: chunkPositions.map(pos => ({
                pageNumber,
                left: pos.left,
                top: pos.top,
                width: pos.width,
                height: pos.height
              }))
            }
          }
        });
        
        // Update offset for next chunk search
        chunkOffset = chunkStartInPage + chunkText.length;
      });
    }
  });
  
  return chunks;
}

/**
 * Calculate bounding rectangle for a set of positions
 */
function calculateBoundingRect(positions: any[]): { left: number; top: number; width: number; height: number } {
  if (!positions.length) {
    return { left: 0, top: 0, width: 100, height: 20 };
  }
  
  // Find the min/max coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  positions.forEach(pos => {
    minX = Math.min(minX, pos.left);
    minY = Math.min(minY, pos.top);
    maxX = Math.max(maxX, pos.left + (pos.width || 0));
    maxY = Math.max(maxY, pos.top + (pos.height || 0));
  });
  
  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Split text into chunks that preserve paragraph integrity
 * This improved version prioritizes keeping paragraphs together when possible
 * while maintaining the target chunk size and overlap
 */
function splitTextIntoChunks(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
  if (!text || text.length <= chunkSize) {
    return [text];
  }

  // Split text into paragraphs using a more robust pattern that handles different line break styles
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  
  // Approach: group paragraphs into chunks, respecting paragraph boundaries when possible
  let currentChunk: string[] = [];
  let currentLength = 0;
  let lastAddedParagraphIndex = -1;

  // Process each paragraph
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    const paragraphLength = paragraph.length;

    // Case 1: Very large paragraph (exceeds chunk size on its own)
    if (paragraphLength > chunkSize) {
      // If we have content in the current chunk, finalize it first
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [];
        currentLength = 0;
      }
      
      // Split large paragraph into sentences
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0);
      
      let sentenceGroup: string[] = [];
      let sentenceGroupLength = 0;
      
      // Group sentences into chunks
      sentences.forEach(sentence => {
        // If adding this sentence would exceed chunk size
        if (sentenceGroupLength + sentence.length > chunkSize && sentenceGroup.length > 0) {
          // Store the current sentence group
          chunks.push(sentenceGroup.join(' '));
          
          // Start new group with overlap - include the last sentence for context
          if (sentenceGroup.length > 1) {
            const contextSentence = sentenceGroup[sentenceGroup.length - 1];
            sentenceGroup = [contextSentence];
            sentenceGroupLength = contextSentence.length;
          } else {
            sentenceGroup = [];
            sentenceGroupLength = 0;
          }
        }
        
        // Add sentence to the group
        sentenceGroup.push(sentence);
        sentenceGroupLength += sentence.length + (sentenceGroup.length > 1 ? 1 : 0); // +1 for space
      });
      
      // Add any remaining sentences
      if (sentenceGroup.length > 0) {
        chunks.push(sentenceGroup.join(' '));
      }
      
      // Track this paragraph for potential overlap
      lastAddedParagraphIndex = i;
      continue;
    }
    
    // Case 2: Adding this paragraph would exceed chunk size
    if (currentLength + paragraphLength > chunkSize && currentChunk.length > 0) {
      // Store current chunk
      chunks.push(currentChunk.join('\n\n'));
      
      // For overlap, include the last paragraph if it's not too large
      const lastParagraph = currentChunk[currentChunk.length - 1];
      if (lastParagraph && lastParagraph.length < chunkOverlap) {
        currentChunk = [lastParagraph];
        currentLength = lastParagraph.length;
      } else {
        currentChunk = [];
        currentLength = 0;
      }
    }
    
    // Add the paragraph to the current chunk
    currentChunk.push(paragraph);
    currentLength += paragraphLength + (currentChunk.length > 1 ? 2 : 0); // +2 for paragraph break
    lastAddedParagraphIndex = i;
  }
  
  // Add any remaining content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }
  
  // Post-process: ensure chunks have context from previous chunks
  return chunks.map((chunk, i) => {
    // If not the first chunk, add context from the previous chunk
    if (i > 0) {
      const prevChunk = chunks[i - 1];
      // Extract the last paragraph or sentence for context
      let context = '';
      
      // Try to get the last paragraph
      const prevParagraphs = prevChunk.split(/\n\s*\n/);
      if (prevParagraphs.length > 0) {
        const lastPara = prevParagraphs[prevParagraphs.length - 1];
        if (lastPara.length < chunkOverlap) {
          context = lastPara;
        } else {
          // If paragraph is too large, get just the last sentence
          const sentences = lastPara.split(/(?<=[.!?])\s+/);
          if (sentences.length > 0) {
            context = sentences[sentences.length - 1];
          }
        }
      }
      
      // Add context if we found some
      if (context && !chunk.startsWith(context)) {
        return `${context}\n\n${chunk}`;
      }
    }
    return chunk.trim();
  });
}

/**
 * Check if text likely contains a table structure
 */
function containsTable(text: string): boolean {
  // Simple heuristic: contains multiple lines with | or has consistent spacing patterns
  const lines = text.split('\n');
  
  // Check for pipe characters (common in markdown tables)
  const pipeLines = lines.filter(line => line.includes('|'));
  if (pipeLines.length >= 3) {
    return true;
  }
  
  // Check for consistent spacing patterns (at least 3 lines with similar pattern)
  const spacingPatterns = lines.map(line => {
    const matches = line.match(/\s{2,}/g);
    return matches ? matches.length : 0;
  });
  
  // Count lines with the same spacing pattern
  const patternMap: Record<number, number> = {};
  spacingPatterns.forEach(count => {
    if (count > 2) {  // Ignore lines with few spaces
      patternMap[count] = (patternMap[count] || 0) + 1;
    }
  });
  
  // If we have at least 3 lines with the same spacing pattern, it might be a table
  return Object.values(patternMap).some(count => count >= 3);
} 