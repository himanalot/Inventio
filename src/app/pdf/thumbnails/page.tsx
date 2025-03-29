"use client";

import '@/lib/polyfills';
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import {
  useSearch,
  usePdf,
  usePdfJump,
  SearchResult,
  calculateHighlightRects
} from "@anaralabs/lector";
import { cn } from "@/lib/utils";
import { useDebounce } from "use-debounce";
import "@/lib/setup";
import { Button } from "@/components/ui/button";
import OptimalPDFViewer from "@/components/OptimalPDFViewer";
import FileLibrary from '@/components/FileLibrary';
import { getCurrentUser } from '@/lib/supabase';
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileObject, listUserFiles, getFileDownloadUrl } from '@/lib/file-service';
import ChatPanel from '@/components/chat/ChatPanel';
import { ChatConversation, getDocumentConversations, createChatConversation, updateConversationMetadata } from '@/lib/chat-service';
import DocumentSearch from '@/components/DocumentSearch';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import DocumentInfoSidebar from "@/components/DocumentInfoSidebar";
import MobileDetectionOverlay from "@/components/MobileDetectionOverlay";
import LoginDialog from "@/components/auth/LoginDialog";
import { supabase } from '@/lib/supabase';

// Define constants and types needed for PDF viewing
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
  `
};

// Define an extended type for ChatConversation that includes metadata
interface ExtendedChatConversation extends ChatConversation {
  metadata?: {
    documentInfo?: any;
    [key: string]: any;
  };
}

const DownloadDialog = ({ isOpen, onClose, onDownload }: { isOpen: boolean; onClose: () => void; onDownload: (filename: string) => void }) => {
  const [filename, setFilename] = useState("document");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDownload(filename + '.pdf');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/20 backdrop-blur-[0.5px] transition-all duration-100"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-background border shadow-xl rounded-lg w-full max-w-md scale-100 animate-in fade-in duration-200">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground">Download PDF</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a name for your downloaded file
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4">
          <div className="space-y-2">
            <label 
              htmlFor="filename" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              File name
            </label>
            <div className="flex">
              <input
                type="text"
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex h-10 w-full rounded-l-md border border-r-0 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
              <div className="flex h-10 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                .pdf
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 bg-foreground text-background hover:bg-foreground/90"
            >
              Download
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DocumentMenu = ({ selectedFileUrl }: { selectedFileUrl: string }) => {
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  const handleDownload = (filename: string) => {
    // Use the selected file URL
    const link = document.createElement('a');
    link.href = selectedFileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setShowDownloadDialog(true)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      <DownloadDialog 
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        onDownload={handleDownload}
      />
    </>
  );
};

const ZoomMenu = () => {
  return null;
};

// Result item for search results
const ResultItem = ({ result, type }: { result: SearchResult; type: 'exact' | 'fuzzy' }) => {
  const { jumpToHighlightRects } = usePdfJump();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);

  const onClick = async () => {
    const pageProxy = await getPdfPageProxy(result.pageNumber);
    if (!pageProxy) return;
    
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
    });
    jumpToHighlightRects(rects, "pixels");
  };

  return (
    <div
      className="flex py-2 hover:bg-gray-200 flex-col cursor-pointer px-2 rounded-md"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm">{result.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            type === 'exact' 
              ? "bg-green-100 text-green-700" 
              : "bg-yellow-100 text-yellow-700"
          )}>
            {type === 'exact' ? 'Exact' : 'Similar'}
          </span>
          <span className="text-xs text-gray-500">Page {result.pageNumber}</span>
        </div>
      </div>
    </div>
  );
};

// Search UI Component
function SearchPanel() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 300);
  const [limit, setLimit] = useState(5);
  const [isSearching, setIsSearching] = useState(false);
  const [searchState, setSearchState] = useState<{
    exactMatches: SearchResult[];
    fuzzyMatches: SearchResult[];
    hasMoreResults: boolean;
  }>({
    exactMatches: [],
    fuzzyMatches: [],
    hasMoreResults: false
  });
  const { search } = useSearch();

  const performSearch = async (searchValue: string, searchLimit: number = 5) => {
    if (!searchValue.trim()) {
      setSearchState({
        exactMatches: [],
        fuzzyMatches: [],
        hasMoreResults: false
      });
      return;
    }

    try {
      setIsSearching(true);
      const response = await search(searchValue, { limit: searchLimit });
      
      setSearchState({
        exactMatches: response.exactMatches || [],
        fuzzyMatches: response.fuzzyMatches || [],
        hasMoreResults: response.hasMoreResults || false
      });
      setLimit(searchLimit);
    } catch (error) {
      console.error('Search error:', error);
      setSearchState({
        exactMatches: [],
        fuzzyMatches: [],
        hasMoreResults: false
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    performSearch(debouncedSearchText);
  }, [debouncedSearchText]);

  const handleLoadMore = async () => {
    if (!searchText.trim() || isSearching) return;
    const newLimit = limit + 5;
    performSearch(searchText, newLimit);
  };

  const totalResults = (searchState.exactMatches?.length || 0) + (searchState.fuzzyMatches?.length || 0);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-6-6" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search in document..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-md border"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {isSearching ? (
            <div className="text-sm text-gray-500 text-center py-8">
              Searching...
            </div>
          ) : !searchText ? (
            <div className="text-sm text-gray-500 text-center py-8">
              Type to search in document
            </div>
          ) : totalResults === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              No results found for "{searchText}"
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2">
                Found {totalResults} results
              </div>
              <div className="divide-y divide-gray-200">
                {searchState.exactMatches?.map((result) => (
                  <ResultItem
                    key={`exact-${result.pageNumber}-${result.matchIndex}`}
                    result={result}
                    type="exact"
                  />
                ))}
                {searchState.fuzzyMatches?.map((result) => (
                  <ResultItem
                    key={`fuzzy-${result.pageNumber}-${result.matchIndex}`}
                    result={result}
                    type="fuzzy"
                  />
                ))}
              </div>
              {searchState.hasMoreResults && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Load more results
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loader style
const loaderStyle = `
.loader-gray {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  border: 2px solid;
  border-color: #888 #888 transparent transparent;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

function AnaraViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMainSidebar, setShowMainSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'search'>('thumbnails');
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [contentWidth, setContentWidth] = useState('85%'); // Increased since we're removing the chat panel
  const [selectedFileUrl, setSelectedFileUrl] = useState<string>('');
  const [showLibrary, setShowLibrary] = useState<boolean>(true); // Auto-show library on start if no document is selected
  const isDragging = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const hasInitializedFromUrl = useRef<boolean>(false);
  // Add state to control document search dialog
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);

  // Add state for chat panel width
  const [chatPanelWidth, setChatPanelWidth] = useState<number>(650); // Wider default (was 550px)
  const isDraggingChat = useRef(false);

  // Add these to the existing state variables in the component
  const [documents, setDocuments] = useState<FileObject[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ExtendedChatConversation | null>(null);
  const [showChat, setShowChat] = useState<boolean>(true);
  
  // Add state for document info sidebar
  const [showInfoSidebar, setShowInfoSidebar] = useState<boolean>(false);
  const [documentMetadata, setDocumentMetadata] = useState<any>({});
  const [documentSummary, setDocumentSummary] = useState<string>('');
  const [documentAbstract, setDocumentAbstract] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  
  // Add state for login dialog
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  
  // Add state for highlight position
  const [highlightPosition, setHighlightPosition] = useState<{
    pageNumber: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Add state variables for document search functionality
  const [searchDocumentIndex, setSearchDocumentIndex] = useState<number>(0);
  const [searchDocumentQuery, setSearchDocumentQuery] = useState<string>('');
  const searchDocumentListRef = useRef<HTMLDivElement>(null);
  
  // Function to scroll selected document into view
  const scrollSelectedDocumentIntoView = (index: number) => {
    if (searchDocumentListRef.current) {
      const selectedElement = searchDocumentListRef.current.querySelector(`[data-index="${index}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };
  
  // Compute filtered documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchDocumentQuery.trim()) {
      return documents;
    }
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(searchDocumentQuery.toLowerCase())
    );
  }, [documents, searchDocumentQuery]);
  
  // Get the current user when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
        setUser(currentUser);
          setShowLoginDialog(false);
          
          // Fetch documents since we have an authenticated user
          try {
            const userFiles = await listUserFiles(currentUser.id);
            setDocuments(userFiles);
          } catch (error) {
            console.error('Error fetching user documents:', error);
          }
        } else {
          // User is not authenticated, show login dialog
          setShowLoginDialog(true);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Show login dialog in case of error
        setShowLoginDialog(true);
      }
    };
    
    fetchUser();
    
    // Listen for auth state changes
    const handleAuthStateChange = async () => {
      await fetchUser();
    };
    
    window.addEventListener('auth-state-changed', handleAuthStateChange);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, []);
  
  // Fetch user documents when component mounts
  useEffect(() => {
    const fetchUserDocuments = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          const userFiles = await listUserFiles(currentUser.id);
          setDocuments(userFiles);
        }
      } catch (error) {
        console.error('Error fetching user documents:', error);
      }
    };
    
    if (user) {
    fetchUserDocuments();
    }
  }, [user]);
  
  // Handle file upload and deletion events
  useEffect(() => {
    // Add improved event listener for file upload events
    const handleFileUpload = async (event: any) => {
      console.log("File uploaded event received:", event.detail);
      
      // Get the uploaded file object from the event detail
      const fileDetail = event.detail;
      
      if (fileDetail && fileDetail.fileObject) {
        // Directly update the documents list with the new file
        setDocuments(prevDocs => {
          // Check if the file already exists in the list
          const exists = prevDocs.some(doc => doc.path === fileDetail.fileObject.path);
          
          // If it doesn't exist, add it to the beginning of the list
          if (!exists) {
            return [fileDetail.fileObject, ...prevDocs];
          }
          return prevDocs;
        });
        
        // If we need a full refresh, fetch all files again
        if (fileDetail.forceRefresh && user) {
          const refreshedFiles = await listUserFiles(user.id);
          setDocuments(refreshedFiles);
        }
        
        // Automatically select and load the newly uploaded file
        if (fileDetail.fileObject) {
          console.log("Auto-selecting newly uploaded file:", fileDetail.fileObject.path);
          // Generate a fresh URL for the file
          const freshUrl = await getFileDownloadUrl(fileDetail.fileObject.path);
          setShowLibrary(false);
          await loadDocument(fileDetail.fileObject, freshUrl);
        }
      }
    };
    
    // Add event listener for file deletion events
    const handleFileDeleted = (event: any) => {
      console.log("[DEDICATED DELETION HANDLER] File deleted event received:", event.detail);
      
      const { filePath } = event.detail;
      
      if (filePath) {
        console.log("[DEDICATED DELETION HANDLER] Removing file path from documents:", filePath);
        
        // Update documents list to remove the deleted file
        setDocuments(prevDocs => {
          const updatedDocs = prevDocs.filter(doc => doc.path !== filePath);
          console.log("[DEDICATED DELETION HANDLER] Documents before:", prevDocs.length, "after:", updatedDocs.length);
          return updatedDocs;
        });
        
        // If the deleted document is currently selected, reset the view
        if (searchParams.get('doc') === filePath) {
          console.log("[DEDICATED DELETION HANDLER] Currently viewed document was deleted, resetting view");
          // Clear the selected file
          setSelectedFileUrl('');
          // Show the library
          setShowLibrary(true);
          // Clear the conversation
          setCurrentConversation(null);
          // Update URL
          router.push('/pdf/thumbnails', { scroll: false });
        }
      }
    };
    
    // Set up event listeners
    window.addEventListener('file-uploaded', handleFileUpload);
    window.addEventListener('file-deleted', handleFileDeleted);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('file-uploaded', handleFileUpload);
      window.removeEventListener('file-deleted', handleFileDeleted);
    };
  }, [documents, user, router, searchParams]); // Include documents in dependencies to ensure latest reference

  // Define loadDocument function early in the component
  const loadDocument = async (doc: FileObject, fileUrl: string) => {
    console.log(`Loading document: ${doc.name}, path: ${doc.path}`);
    
    try {
      setIsInitializing(true);
      setDocumentMetadata({});
      setDocumentSummary('');
      setDocumentAbstract('');
      setIsLoadingMetadata(true);
      
      // Check if the URL is accessible
      const isValid = await isUrlAccessible(fileUrl);
      if (!isValid) {
        throw new Error('Cannot access file URL');
      }
      
      // Set the selected file URL for display
      setSelectedFileUrl(fileUrl);
      
      // Store the document ID in the URL for persistence
      const hasUrlParams = window.location.href.includes('?');
      const newUrl = hasUrlParams 
        ? window.location.href.split('?')[0] + `?doc=${encodeURIComponent(doc.path)}`
        : window.location.href + `?doc=${encodeURIComponent(doc.path)}`;
      
      // Replace the current history state to avoid navigation issues
      window.history.replaceState({ path: newUrl }, '', newUrl);
      
      // Get existing conversations for this document
      try {
        let conversations;
        let extractedMetadata = false;
        
        if (user && user.id) {
          // First try with the document path
          conversations = await getDocumentConversations(user.id, fileUrl, doc.path);
          
          if (!conversations || conversations.length === 0) {
            // Fallback to just the URL
            conversations = await getDocumentConversations(user.id, fileUrl);
          }
          
          if (conversations && conversations.length > 0) {
            // Use the first conversation found
            const firstConversation = conversations[0] as ExtendedChatConversation;
            console.log("Using existing conversation:", firstConversation.id);
            setCurrentConversation(firstConversation);
            
            // If conversation has summary, use it for the info sidebar
            if (firstConversation.summary) {
              setDocumentSummary(firstConversation.summary);
            }
            
            // Check if the conversation has metadata stored
            if (firstConversation.metadata && firstConversation.metadata.documentInfo) {
              const storedMetadata = firstConversation.metadata.documentInfo;
              setDocumentMetadata(storedMetadata);
              
              // If the conversation has an abstract, use it
              if (storedMetadata.abstract) {
                setDocumentAbstract(storedMetadata.abstract);
              }
              
              extractedMetadata = true;
              console.log("Using metadata from existing conversation:", storedMetadata);
            }
            
            setShowChat(true);
            // Don't automatically show info sidebar
            // setShowInfoSidebar(true);
          } else {
            console.log("No existing conversations found, creating new conversation");
            
            // Extract metadata from the PDF using AI
            console.log("Extracting metadata from document...");
            setIsLoadingMetadata(true);
            
            // Extract metadata using Gemini
            const extractedData = await extractDocumentMetadata(doc, fileUrl);
            
            // Create a new conversation
            const newConversation = await createChatConversation(
              user.id,
              fileUrl,
              doc.name,
              `Chat about ${doc.name}`,
              doc.path,
              extractedData.summary,
              extractedData.suggestedQuestions,
              undefined, // No quick actions
              { documentInfo: extractedData.metadata } // Store metadata in the conversation
            );
            
            if (newConversation) {
              // Cast to extended type to add metadata property
              const extendedConversation: ExtendedChatConversation = {
                ...newConversation,
                metadata: { documentInfo: extractedData.metadata }
              };
              
              setCurrentConversation(extendedConversation);
              
              // Use the extracted metadata for the sidebar
              setDocumentSummary(extractedData.summary || '');
              setDocumentAbstract(extractedData.metadata.abstract || '');
              setDocumentMetadata(extractedData.metadata);
              
              extractedMetadata = true;
              setShowChat(true);
              // Don't automatically show info sidebar
              // setShowInfoSidebar(true);
              console.log("Created new conversation with extracted metadata");
            }
          }
        }
        
        // If we couldn't extract metadata from existing conversation, do a basic extraction
        if (!extractedMetadata) {
          console.log("No metadata found, performing extraction now...");
          setIsLoadingMetadata(true);
          
          // Extract metadata using Gemini
          const extractedData = await extractDocumentMetadata(doc, fileUrl);
          
          // Use the extracted data
          setDocumentSummary(extractedData.summary || '');
          setDocumentAbstract(extractedData.metadata.abstract || '');
          setDocumentMetadata(extractedData.metadata);
          
          // If we have a conversation but no metadata, update it
          if (currentConversation && user) {
            try {
              console.log("Updating existing conversation with new metadata");
              await updateConversationMetadata(
                currentConversation.id,
                {
                  summary: extractedData.summary,
                  // Keep existing metadata fields
                  suggestedQuestions: currentConversation.suggested_questions,
                  quickActions: currentConversation.quick_actions
                }
              );
              
              // Update the current conversation with the new metadata
              setCurrentConversation({
                ...currentConversation,
                summary: extractedData.summary,
                metadata: { documentInfo: extractedData.metadata }
              });
            } catch (updateError) {
              console.error("Error updating conversation metadata:", updateError);
            }
          }
          
          // Don't automatically show info sidebar
          // setShowInfoSidebar(true);
        }
      } catch (convError) {
        console.error('Error loading conversation:', convError);
        
        // Basic metadata extraction as fallback
        const title = doc.name.replace(/\.pdf$/i, '');
        setDocumentMetadata({ title });
        // Don't automatically show info sidebar
        // setShowInfoSidebar(true);
      } finally {
        setIsLoadingMetadata(false);
      }
      
      // Clear loading and error states
      setIsInitializing(false);
      setError(null);
    } catch (error) {
      console.error("Error loading document:", error);
      setError("Could not load the document. Please try again.");
      setIsInitializing(false);
      setIsLoadingMetadata(false);
    }
  };

  // Convert handleFileSelect to use useCallback to avoid dependency issues
  const handleFileSelect = useCallback(async (fileUrl: string) => {
    console.log("File selected with URL:", fileUrl.substring(0, 50) + "...");
    
    try {
      // Reset state before loading new document
      setSelectedFileUrl('');
      setCurrentConversation(null);
      setIsInitializing(true);
      setShowLibrary(false);
      
      // Find the document in the documents array to get its path
      const doc = documents.find((d: FileObject) => d.url === fileUrl);
      
      if (!doc) {
        console.warn("Could not find document metadata for URL:", fileUrl);
        
        // If this is a newly uploaded file, wait a bit and try again
        // This adds some resilience when the documents list isn't updated yet
        setTimeout(async () => {
          if (user) {
            const refreshedDocs = await listUserFiles(user.id);
            setDocuments(refreshedDocs);
            
            const refreshedDoc = refreshedDocs.find((d: FileObject) => d.url === fileUrl);
            if (refreshedDoc) {
              // Instead of using the URL from the document object, get a fresh one
              try {
                const freshUrl = await getFileDownloadUrl(refreshedDoc.path);
                console.log("Generated fresh URL for document after refresh");
                // Use the fresh URL instead of the one stored in the document object
                await loadDocument(refreshedDoc, freshUrl);
              } catch (urlError) {
                console.error("Error getting fresh URL after refresh:", urlError);
                setError(`Failed to get a fresh URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
                setIsInitializing(false);
              }
            } else {
              setError("Could not find document metadata. Please try again or select another file.");
              setIsInitializing(false);
            }
          }
        }, 500);
        return;
      }
      
      // Always get a fresh URL when selecting a document, regardless of the URL passed in
      try {
        const freshUrl = await getFileDownloadUrl(doc.path);
        console.log("Generated fresh URL for document selection");
        // Use the fresh URL instead of the one stored in fileUrl parameter
        await loadDocument(doc, freshUrl);
      } catch (urlError) {
        console.error("Error getting fresh URL:", urlError);
        setError(`Failed to get a fresh URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
        setIsInitializing(false);
      }
      
      } catch (err) {
      console.error('Error in handleFileSelect:', err);
      setError(`Failed to load document: ${err instanceof Error ? err.message : String(err)}`);
      setIsInitializing(false);
    }
  }, [documents, user, router, loadDocument, setSelectedFileUrl, setCurrentConversation, 
      setIsInitializing, setShowLibrary, setError, setDocuments]);
  
  // This function uses AI to extract metadata from the document
  const extractDocumentMetadata = async (doc: FileObject, fileUrl: string) => {
    console.log("Extracting metadata for:", doc.name);
    
    try {
      // Extract the filename as title (without .pdf extension)
      const filenameTitle = doc.name.replace(/\.pdf$/i, '');
      console.log("Using filename as default title:", filenameTitle);
      
      // Helper function to generate default questions
      const generateDefaultQuestions = (title: string) => [
        `What are the main points of "${title}"?`,
        `Can you summarize the key findings in "${title}"?`,
        `How is "${title}" organized?`,
        `What are the practical applications of the information in "${title}"?`,
        `What broader trends does "${title}" connect to?`
      ];
      
      // Initialize default metadata with the filename as title
      const defaultMetadata = {
        title: filenameTitle,
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
      };
      
      // First try to get the file content
      console.log("Fetching PDF content from URL:", fileUrl.substring(0, 50) + "...");
      const response = await fetch(fileUrl);
      if (!response.ok) {
        console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        return {
          metadata: defaultMetadata,
          summary: `This is a document titled "${filenameTitle}".`,
          suggestedQuestions: generateDefaultQuestions(filenameTitle)
        };
      }
      
      // Get the file content as ArrayBuffer
      const fileContent = await response.arrayBuffer();
      console.log(`PDF content fetched successfully: ${(fileContent.byteLength / 1024).toFixed(2)} KB`);
      
      // Define Gemini prompts
      const COMBINED_PROMPT = `
        Analyze this PDF document and provide the following information in a structured format:

        PART 1 - METADATA:
        Extract these metadata fields from the document and return them in a simple text format with clear labels:
        
        Title: [The full title of the document]
        Authors: [Authors names, comma separated]
        Publication: [Journal or publication name]
        Volume: [Volume number if applicable]
        Issue: [Issue number if applicable]
        Pages: [Page range (e.g., 123-145)]
        Issue Date: [Publication date]
        DOI: [Digital Object Identifier if present]
        ISSN: [ISSN if present]
        URL: [URL if mentioned in the document]
        
        For any field not found in the document, write "Unavailable" after the label.
        
        EXTREMELY IMPORTANT FORMATTING INSTRUCTIONS:
        1. DO NOT use any backticks (\`) or code block markers (\`\`\`)
        2. DO NOT wrap your response in quotes
        3. DO NOT format as JSON or any other structured format
        4. JUST provide raw text with the field labels as shown above
        5. DO NOT include markdown formatting of any kind
        
        PART 2 - SUMMARY:
        Provide a comprehensive, detailed summary in a single paragraph of 4-6 sentences.
        
        Focus on including:
        - Specific details, statistics, and facts from the document
        - Context about organizations, locations, or settings mentioned
        - Key achievements, qualifications, or metrics if applicable
        - Any evaluative observations based on the document content
        - A concluding statement about the broader significance
        
        Do not include introductory phrases like "This document" or "The PDF."
        
        PART 3 - ABSTRACT:
        Extract or create a concise abstract (3-5 sentences) that captures the essence of the document.
        
        PART 4 - QUESTIONS:
        Generate 5 short, simple questions about the document, focusing on:
        1. Practical applications
        2. Why this information matters
        3. Future implications
        4. Impact on key stakeholders
        5. Connection to broader trends
        
        Keep questions brief and direct. Each question should be on a separate line with no numbering or labels.
        
        REMEMBER: Your response should be plain text only with the section headings. No code blocks, no JSON, no quotation marks around the entire response.
      `;
      
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
      
      // Get Gemini API key from environment variables
      const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
      
      if (!GEMINI_API_KEY) {
        console.error('Gemini API key not configured');
        return {
          metadata: defaultMetadata,
          summary: `This is a document titled "${filenameTitle}".`,
          suggestedQuestions: generateDefaultQuestions(filenameTitle)
        };
      }
      
      // Helper function to convert ArrayBuffer to base64
      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
      };
      
      // Helper function to call Gemini API with better error handling
      const callGeminiWithPdf = async (prompt: string, retryCount = 0): Promise<string> => {
        try {
          console.log(`Calling Gemini API with prompt: ${prompt.substring(0, 50)}...`);
          const base64Pdf = arrayBufferToBase64(fileContent);
          
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
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API error (${response.status}): ${errorText}`);
            
            // If we've retried less than 2 times and it's a 429 or 5xx error, retry
            if (retryCount < 2 && (response.status === 429 || response.status >= 500)) {
              console.log(`Retrying API call (attempt ${retryCount + 1})`);
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              return callGeminiWithPdf(prompt, retryCount + 1);
            }
            
            return "";
          }
          
          const data = await response.json();
          
          if (data.candidates && data.candidates.length > 0 && 
              data.candidates[0].content && 
              data.candidates[0].content.parts && 
              data.candidates[0].content.parts.length > 0) {
            const result = data.candidates[0].content.parts[0].text;
            console.log(`Received Gemini response, length: ${result.length} characters`);
            
            // Clean the response text immediately to remove code block markers
            const cleanedResult = cleanTextOutput(result);
            console.log(`Cleaned response, length: ${cleanedResult.length} characters`);
            
            return cleanedResult;
          } else {
            console.error('Unexpected Gemini API response format:', JSON.stringify(data));
            return "";
          }
        } catch (error) {
          console.error('Error calling Gemini API:', error);
          return "";
        }
      };
      
      // Make a single API call with the combined prompt
      console.log("Making API call to Gemini for combined metadata, summary, and questions");
      const combinedResult = await callGeminiWithPdf(COMBINED_PROMPT);
      
      // Parse the combined result into separate sections
      const metadata = { ...defaultMetadata };
      let summary = `This is a document titled "${filenameTitle}".`;
      let abstract = "";
      let suggestedQuestions = generateDefaultQuestions(filenameTitle);
      
      if (combinedResult && combinedResult.trim()) {
        console.log('Received combined result from Gemini, parsing sections');
        
        try {
          // Extract metadata fields using regex
          const titleMatch = combinedResult.match(/Title:\s*([^\n]+)/);
          const authorsMatch = combinedResult.match(/Authors:\s*([^\n]+)/);
          const publicationMatch = combinedResult.match(/Publication:\s*([^\n]+)/);
          const volumeMatch = combinedResult.match(/Volume:\s*([^\n]+)/);
          const issueMatch = combinedResult.match(/Issue:\s*([^\n]+)/);
          const pagesMatch = combinedResult.match(/Pages:\s*([^\n]+)/);
          const issueDateMatch = combinedResult.match(/Issue Date:\s*([^\n]+)/);
          const doiMatch = combinedResult.match(/DOI:\s*([^\n]+)/);
          const issnMatch = combinedResult.match(/ISSN:\s*([^\n]+)/);
          const urlMatch = combinedResult.match(/URL:\s*([^\n]+)/);
          
          // Update metadata fields if found
          if (titleMatch && titleMatch[1] && !titleMatch[1].includes('Unavailable')) {
            metadata.title = titleMatch[1].trim();
          } else {
            metadata.title = filenameTitle; // Default to filename if title not found
          }
          
          if (authorsMatch && authorsMatch[1] && !authorsMatch[1].includes('Unavailable')) {
            metadata.authors = authorsMatch[1].trim();
          }
          
          if (publicationMatch && publicationMatch[1] && !publicationMatch[1].includes('Unavailable')) {
            metadata.publication = publicationMatch[1].trim();
          }
          
          if (volumeMatch && volumeMatch[1] && !volumeMatch[1].includes('Unavailable')) {
            metadata.volume = volumeMatch[1].trim();
          }
          
          if (issueMatch && issueMatch[1] && !issueMatch[1].includes('Unavailable')) {
            metadata.issue = issueMatch[1].trim();
          }
          
          if (pagesMatch && pagesMatch[1] && !pagesMatch[1].includes('Unavailable')) {
            metadata.pages = pagesMatch[1].trim();
          }
          
          if (issueDateMatch && issueDateMatch[1] && !issueDateMatch[1].includes('Unavailable')) {
            metadata.issue_date = issueDateMatch[1].trim();
          }
          
          if (doiMatch && doiMatch[1] && !doiMatch[1].includes('Unavailable')) {
            metadata.doi = doiMatch[1].trim();
          }
          
          if (issnMatch && issnMatch[1] && !issnMatch[1].includes('Unavailable')) {
            metadata.issn = issnMatch[1].trim();
          }
          
          if (urlMatch && urlMatch[1] && !urlMatch[1].includes('Unavailable')) {
            metadata.url = urlMatch[1].trim();
          }
          
          // Set date field
          metadata.date = new Date().toISOString().split('T')[0]; // Today's date
          
          // Try to find the summary section
          const summaryPattern = /PART 2 - SUMMARY:[\s\S]*?(?=PART 3|$)/i;
          const summaryMatch = combinedResult.match(summaryPattern);
          
          if (summaryMatch && summaryMatch[0]) {
            // Extract the summary text, removing the heading
            const summaryText = summaryMatch[0].replace(/PART 2 - SUMMARY:\s*/i, '').trim();
            if (summaryText) {
              summary = summaryText;
            }
          }
          
          // Try to find the abstract section
          const abstractPattern = /PART 3 - ABSTRACT:[\s\S]*?(?=PART 4|$)/i;
          const abstractMatch = combinedResult.match(abstractPattern);
          
          if (abstractMatch && abstractMatch[0]) {
            // Extract the abstract text, removing the heading
            const abstractText = abstractMatch[0].replace(/PART 3 - ABSTRACT:\s*/i, '').trim();
            if (abstractText) {
              abstract = abstractText;
              metadata.abstract = abstractText; // Store abstract in metadata
            }
          }
          
          // Try to find the questions section
          const questionsPattern = /PART 4 - QUESTIONS:[\s\S]*/i;
          const questionsMatch = combinedResult.match(questionsPattern);
          
          if (questionsMatch && questionsMatch[0]) {
            // Extract questions, removing the heading
            const questionsText = questionsMatch[0].replace(/PART 4 - QUESTIONS:\s*/i, '').trim();
            if (questionsText) {
              const questions = questionsText.split('\n')
                .map(q => q.trim())
                .filter(q => q && q.length > 0);
              
              if (questions.length > 0) {
                suggestedQuestions = questions;
              }
            }
          }
          
          console.log('Successfully parsed metadata and content sections');
    } catch (error) {
          console.error('Error parsing combined result:', error);
          console.log('Using default values for metadata and content');
        }
      } else {
        console.log('No combined result received from Gemini, using default values');
      }
      
      console.log('Extracted document data:', {
        title: metadata.title,
        summary: summary.substring(0, 50) + '...',
        questionsCount: suggestedQuestions.length
      });
      
      return {
        metadata: {
          ...metadata,
          abstract: abstract || ''
        },
        summary,
        suggestedQuestions
      };
    } catch (error) {
      console.error('Error extracting document metadata with AI:', error);
      
      // Fallback to basic extraction if AI fails
      const title = doc.name.replace(/\.pdf$/i, '');
      console.log('Using fallback metadata with title from filename:', title);
      
      // Return default values
      return {
        metadata: {
          title,
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
        summary: `This is a document titled "${title}".`,
        suggestedQuestions: [
          `What are the main points of "${title}"?`,
          `Can you summarize the key findings in "${title}"?`,
          `How is "${title}" organized?`,
          `What evidence supports the main arguments in "${title}"?`,
          `What are the practical implications of "${title}"?`
        ]
      };
    }
  };
  
  // A utility function to check if a URL is valid and accessible
  const isUrlAccessible = async (url: string): Promise<boolean> => {
    const maxRetries = 2;
    let retryCount = 0;
    
    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Retry logic for URL check
    const checkUrl = async (): Promise<boolean> => {
      try {
        // Use a timeout to avoid hanging if the request takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
        console.error(`URL accessibility check failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff: wait longer between each retry
          const backoffTime = Math.pow(2, retryCount) * 500; // 1s, 2s
          console.log(`Retrying URL accessibility check in ${backoffTime}ms...`);
          await delay(backoffTime);
          return checkUrl();
        }
        
      return false;
    }
    };
    
    return checkUrl();
  };
  
  // Function to handle URL download by creating a temporary link
  const handleUrlDownload = (url: string, filename: string) => {
    console.log("Downloading URL:", url.substring(0, 50) + "...");
    console.log("With filename:", filename);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to download the current PDF
  const handleDownload = (filename: string) => {
    if (!selectedFileUrl) {
      console.error("No file selected for download");
      return;
    }
    
    console.log("Downloading current file as:", filename);
    handleUrlDownload(selectedFileUrl, filename);
  };

  const startDragging = (e: React.MouseEvent) => {
    isDragging.current = true;
    // Add a class to prevent text selection while dragging
    document.body.classList.add('select-none');
    document.addEventListener('mousemove', handleDragging);
    document.addEventListener('mouseup', stopDragging);
  };

  const handleDragging = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    // Get the container's bounds
    const container = document.getElementById('main-container');
    if (!container) return;
    
    const bounds = container.getBoundingClientRect();
    const sidebarWidth = showMainSidebar ? 256 : 48; // 64 or 12 * 4 (w-64 or w-12)
    
    // Calculate the percentage width based on mouse position
    const x = e.clientX - bounds.left - sidebarWidth;
    const totalWidth = bounds.width - sidebarWidth;
    let percentage = (x / totalWidth) * 100;
    
    // Clamp the percentage between 30% and 100%
    percentage = Math.max(30, Math.min(100, percentage));
    
    setContentWidth(`${percentage}%`);
  };

  const stopDragging = () => {
    isDragging.current = false;
    // Remove the class when done dragging
    document.body.classList.remove('select-none');
    document.removeEventListener('mousemove', handleDragging);
    document.removeEventListener('mouseup', stopDragging);
  };

  // Add CSS styles via a style element for PDF zooming containment
  useEffect(() => {
    // Create style element if it doesn't exist
    const styleId = 'pdf-zoom-containment-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        /* Contain PDF zooming within its container */
        .pdf-container {
          contain: size layout;
          overflow: auto;
        }
        
        /* Override PDF.js default zooming behavior */
        .pdf-container .pdf-page {
          margin: 0 auto !important;
        }
        
        /* Override zoom transformation */
        .textLayer, .canvasWrapper, .anara-highlight-layer {
          overflow: visible !important;
        }
        
        /* Ensure PDF container doesn't cause layout shifts during zoom */
        .pdf-container .lector-root {
          contain: layout;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Get document URL from query parameter and load document
  useEffect(() => {
    const documentId = searchParams.get('doc');
    
    // Only load from URL if we haven't already done so and have documents loaded
    if (documentId && user && documents.length > 0 && !hasInitializedFromUrl.current) {
      // Find the document in the documents array
      const doc = documents.find((d: FileObject) => d.path === documentId);
      if (doc) {
        console.log("Loading document from URL parameter:", documentId);
        
        // Get a fresh URL and load the document
        const loadDocumentFromPath = async () => {
          try {
            // Set loading state when loading from URL
            setIsInitializing(true);
            
            // Get a fresh signed URL for the document
            const freshUrl = await getFileDownloadUrl(doc.path);
            console.log("Generated fresh URL for document from URL parameter");
            
            // Check if the URL is accessible before using it
            const isUrlValid = await isUrlAccessible(freshUrl);
            if (!isUrlValid) {
              console.error("Generated URL is not accessible, retrying...");
              // Try one more time with a new URL
              const retryUrl = await getFileDownloadUrl(doc.path);
              const isRetryValid = await isUrlAccessible(retryUrl);
              
              if (!isRetryValid) {
                throw new Error("Cannot access document URL after retry");
              }
              
              console.log("Retry URL is valid, using it");
              setSelectedFileUrl(retryUrl);
            } else {
              // URL is accessible, use it
            setSelectedFileUrl(freshUrl);
            }
            
        setShowLibrary(false); // Hide library when document is loaded from URL
            
            // Also load the conversation
            if (user) {
              try {
                // Use the document path rather than the URL for more reliable conversation finding
                const conversations = await getDocumentConversations(user.id, doc.path, doc.path);
                
                if (conversations && conversations.length > 0) {
                  console.log("Found existing conversation for document");
                  setCurrentConversation(conversations[0] as ExtendedChatConversation);
                  setShowChat(true);
                } else {
                  console.log("No existing conversations found, creating new conversation");
                  const newConversation = await createChatConversation(
                    user.id,
                    freshUrl,
                    doc.name,
                    `Chat about ${doc.name}`,
                    doc.path
                  );
                  
                  if (newConversation) {
                    setCurrentConversation(newConversation as ExtendedChatConversation);
                    setShowChat(true);
                  }
                }
              } catch (convError) {
                console.error('Error loading conversation:', convError);
              }
            }
            
        hasInitializedFromUrl.current = true;
            setIsInitializing(false); // Clear loading state after everything is loaded
          } catch (error) {
            console.error("Error getting fresh URL for document from URL parameter:", error);
            setError("Could not load the document. Please try selecting it from your library.");
            setIsInitializing(false); // Clear loading state on error
            setShowLibrary(true); // Show the library as fallback
          }
        };
        
        loadDocumentFromPath();
      }
    } else if (!documentId && !hasInitializedFromUrl.current && documents.length > 0) {
      // If no document in URL and we haven't initialized yet, show the library
      setShowLibrary(true);
      hasInitializedFromUrl.current = true;
    }
  }, [searchParams, documents, user]);

  // Add chat resize handlers
  const startChatDragging = (e: React.MouseEvent) => {
    isDraggingChat.current = true;
    document.body.classList.add('select-none');
    document.addEventListener('mousemove', handleChatDragging);
    document.addEventListener('mouseup', stopChatDragging);
  };

  const handleChatDragging = (e: MouseEvent) => {
    if (!isDraggingChat.current) return;
    
    // Get the container's bounds
    const container = document.getElementById('main-container');
    if (!container) return;
    
    const bounds = container.getBoundingClientRect();
    const totalWidth = bounds.width;
    
    // Calculate width from the right edge
    const width = totalWidth - e.clientX + bounds.left;
    
    // Clamp the width between 300px and 700px
    const newWidth = Math.max(300, Math.min(700, width));
    
    setChatPanelWidth(newWidth);
  };

  const stopChatDragging = () => {
    isDraggingChat.current = false;
    document.body.classList.remove('select-none');
    document.removeEventListener('mousemove', handleChatDragging);
    document.removeEventListener('mouseup', stopChatDragging);
  };

  // Cleanup dragging event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragging);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('mousemove', handleChatDragging);
      document.removeEventListener('mouseup', stopChatDragging);
    };
  }, []);

  // Add a handler for citation clicks
  const handleCitationClick = (position: any) => {
    console.log('Citation clicked:', position);
    setHighlightPosition(position);
  };

  // Add keyboard shortcut for opening document search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowDocumentSearch(true);
        // Reset search state when opening
        setSearchDocumentIndex(0);
        setSearchDocumentQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Reset search document index when search query changes
  useEffect(() => {
    setSearchDocumentIndex(0);
  }, [searchDocumentQuery]);
  
  // Reset search state when the document search dialog opens
  useEffect(() => {
    if (showDocumentSearch) {
      setSearchDocumentIndex(0);
      setSearchDocumentQuery('');
    }
  }, [showDocumentSearch]);

  useEffect(() => {
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // When a user signs up, reload the page
      if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
        // Use window.location.reload() for a full page refresh
        window.location.reload();
      }
    });
    
    // Clean up listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden relative flex flex-col">
      {/* Mobile Detection Overlay */}
      <MobileDetectionOverlay />

      {/* Login Dialog - Force login for PDF viewer */}
      <LoginDialog 
        isOpen={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        enforceLogin={true}
      />

      {/* Loading overlay - show when initializing */}
      {isInitializing && (
        <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
          <span className="loader-gray"></span>
          <p className="mt-3 text-sm text-gray-600">Loading document...</p>
        </div>
      )}

      {/* Add full-screen backdrop for document search */}
      {showDocumentSearch && (
        <div 
          className="fixed inset-0 bg-background/40 backdrop-blur-[1px] z-[1000]" 
          onClick={() => setShowDocumentSearch(false)}
        />
      )}
      
      {/* Custom DocumentSearch integration - Dialog only, no trigger button */}
      <Dialog open={showDocumentSearch} onOpenChange={setShowDocumentSearch}>
        <DialogContent className="sm:max-w-md p-0 z-[1001]">
          <div className="flex flex-col h-[550px] overflow-hidden" onKeyDown={(e) => {
            // Handle keyboard navigation
            if (e.key === 'Escape') {
              e.preventDefault();
              setShowDocumentSearch(false);
            }
            
            // Implement arrow key navigation
            if (documents.length === 0) return;
            
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSearchDocumentIndex((prevIndex) => {
                const newIndex = prevIndex < documents.length - 1 ? prevIndex + 1 : prevIndex;
                scrollSelectedDocumentIntoView(newIndex);
                return newIndex;
              });
            }
            
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSearchDocumentIndex((prevIndex) => {
                const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
                scrollSelectedDocumentIntoView(newIndex);
                return newIndex;
              });
            }
            
            if (e.key === 'Enter') {
              e.preventDefault();
              if (documents[searchDocumentIndex]) {
                handleFileSelect(documents[searchDocumentIndex].url);
                setShowDocumentSearch(false);
              }
            }
          }}>
            {/* Search input */}
            <div className="border-b p-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-6-6" />
                </svg>
                <input
                  type="text"
                  placeholder="Search your library..."
                  className="w-full pl-10 pr-4 py-2 text-base border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onChange={(e) => setSearchDocumentQuery(e.target.value)}
                  value={searchDocumentQuery}
                />
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">↓</kbd>
                <span className="mr-2">to navigate</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">Enter</kbd>
                <span className="mr-2">to select</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">Esc</kbd>
                <span>to close</span>
              </div>
            </div>

            {/* Library section */}
            <div className="flex-1 overflow-y-auto" ref={searchDocumentListRef}>
              <div className="p-2">
                <h3 className="text-base font-medium px-2 py-1">Library</h3>
                <div className="mt-1">
                  {documents.length > 0 ? (
                    filteredDocuments.map((doc, index) => (
                      <button 
                        key={doc.id}
                        className={`flex items-center gap-3 w-full px-2 py-2 text-left text-sm rounded-md ${
                          index === searchDocumentIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          handleFileSelect(doc.url);
                          setShowDocumentSearch(false);
                        }}
                        onMouseEnter={() => setSearchDocumentIndex(index)}
                        data-index={index}
                      >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{doc.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center p-4 text-gray-500">
                      No documents found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div id="main-container" className="flex h-screen relative z-10">
        {/* Left Navigation Sidebar */}
        <div className={cn(
          "border-r bg-background flex flex-col transition-all duration-300 relative h-screen",
          showMainSidebar ? "w-64" : "w-12"
        )}>
          <div className={cn(
            "p-4 flex items-center shrink-0",
            showMainSidebar ? "justify-between" : "justify-center"
          )}>
            {showMainSidebar && (
              <div className="flex items-center space-x-2">
              <span className="font-medium text-sm transition-opacity duration-300">
                {user?.email}
              </span>
              </div>
            )}
            <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMainSidebar(!showMainSidebar)}
              className="inline-flex items-center relative gap-2 font-semibold justify-center whitespace-nowrap rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground bg-transparent h-7 w-7 hover:bg-muted transition-all duration-200 ease-in-out"
            >
              {showMainSidebar ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m11 17-5-5 5-5" />
                  <path d="m18 17-5-5 5-5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
            </button>
            </div>
          </div>
          
          <div className={cn(
            "flex flex-col py-2 overflow-hidden flex-1",
            showMainSidebar ? "px-2" : "px-0"
          )}>
            <div className="space-y-2 shrink-0">
              <button className={cn(
                "flex items-center gap-3 text-sm hover:bg-muted rounded-md transition-all font-medium",
                showMainSidebar ? "w-full px-4 py-2.5" : "w-12 justify-center py-2.5"
              )}
              onClick={() => router.push('/')}
              >
                <svg className="h-[18px] w-[18px] text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {showMainSidebar && <span>Home</span>}
              </button>
              <button className={cn(
                "flex items-center gap-3 text-sm hover:bg-muted rounded-md transition-all font-medium",
                showMainSidebar ? "w-full px-4 py-2.5" : "w-12 justify-center py-2.5"
              )}
              onClick={() => setShowDocumentSearch(true)}
              aria-label="Search documents"
              title="Search documents (⌘K)"
              >
                <svg className="h-[18px] w-[18px] text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {showMainSidebar && <span>Search</span>}
              </button>
              <button className={cn(
                "flex items-center gap-3 text-sm hover:bg-muted rounded-md transition-all font-medium",
                showMainSidebar ? "w-full px-4 py-2.5" : "w-12 justify-center py-2.5"
              )}
              onClick={() => setShowLibrary(true)}
              >
                <svg className="h-[18px] w-[18px] text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {showMainSidebar && <span>Library</span>}
              </button>
            </div>

            {showMainSidebar && (
              <>
                <div className="mt-6 px-2 flex flex-col flex-1 min-h-0">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 shrink-0">Documents</div>
                  <div className="overflow-y-auto flex-1">
                  <div className="space-y-1">
                    {/* List all documents */}
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <button 
                          key={doc.id}
                            className={`flex items-center gap-3 w-full px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors ${
                              doc.path === searchParams.get('doc') ? "bg-muted font-medium" : ""
                          }`}
                          onClick={() => handleFileSelect(doc.url)}
                        >
                            <svg className="h-[18px] w-[18px] text-gray-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                              <polyline points="14 2 14 8 20 8" />
                      </svg>
                          <span className="truncate">{doc.name}</span>
                    </button>
                      ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 italic">
                        No documents found
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                <div className="border-t mt-4 p-4 shrink-0 text-center">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-medium text-gray-700">Made by Ishan Ramrakhiani</p>
                    <p>Inspired by Anara (Formerly Unriddle)</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle Content - PDF Viewer */}
        <div className="flex-1 flex flex-col">
          {/* Document Title Bar - Fixed at the top */}
          {!showLibrary && (
            <div className="h-[42px] py-3 px-4 bg-background border-b border-border/60 flex items-center justify-between z-[200]">
              <h1 className="text-sm font-medium truncate max-w-full">
                {(() => {
                  if (!selectedFileUrl) return "Document Viewer";
                  const fileName = selectedFileUrl.split('/').pop()?.replace(/\.pdf$/i, '') || "Document Viewer";
                  return fileName.length > 96 ? fileName.substring(0, 96) + '...' : fileName;
                })()}
              </h1>
              
              <div className="flex items-center">
                {/* Chat toggle button */}
                {selectedFileUrl && (
                        <button
                    type="button" 
                    aria-pressed={showChat}
                    data-state={showChat ? "on" : "off"}
                    onClick={() => setShowChat(!showChat)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-1.5 min-w-7 gap-1.5 text-accent-foreground mr-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkle">
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                    </svg>
                    Chat
                        </button>
                )}
                
                {/* Info sidebar toggle button */}
                {selectedFileUrl && (
                  <button 
                    type="button" 
                    aria-pressed={showInfoSidebar}
                    data-state={showInfoSidebar ? "on" : "off"}
                    onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-1.5 min-w-7 gap-1.5 text-accent-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-right">
                      <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                      <path d="M15 3v18"></path>
                    </svg>
                        </button>
                        )}
                      </div>
                    </div>
          )}
          
          {/* Content Area - Below the title bar */}
          <div className="flex-1 flex">
            <div 
              style={{ 
                width: (showChat && !showLibrary) 
                  ? `calc(100% - ${chatPanelWidth}px${showInfoSidebar ? ' - 384px' : ''})` 
                  : showInfoSidebar && !showLibrary
                    ? 'calc(100% - 384px)'
                    : '100%'
              }} 
              className="h-full flex flex-col overflow-hidden relative border-l"
            >
                  {showLibrary ? (
                <div className="h-full w-full overflow-hidden">
                  <div className="sticky top-0 z-50 p-4 border-b flex justify-between items-center bg-background">
                        <h2 className="text-lg font-semibold">Document Library</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLibrary(false)}
                        >
                          Close Library
                        </Button>
                  </div>
                  <div className="overflow-auto h-[calc(100vh-65px)] px-4 pb-4">
                    <div className="container mx-auto px-0 max-w-6xl">
                      <FileLibrary onFileSelect={handleFileSelect} />
                    </div>
                  </div>
                </div>
                  ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                      {selectedFileUrl ? (
                    <div className="h-full w-full overflow-hidden">
                        <OptimalPDFViewer 
                          pdfUrl={selectedFileUrl} 
                          highlightPosition={highlightPosition} 
                        />
                    </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <h3 className="text-lg font-medium mt-4">
                            Select a document to view
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md mt-2">
                            Choose a document from the sidebar or upload a new one to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
          </div>

            {/* Document Info Sidebar */}
            {!showLibrary && (
              <DocumentInfoSidebar
                isOpen={showInfoSidebar}
                onClose={() => setShowInfoSidebar(false)}
                summary={documentSummary}
                abstract={documentAbstract}
                metadata={documentMetadata}
                isLoading={isLoadingMetadata}
                documentName={selectedFileUrl ? selectedFileUrl.split('/').pop()?.replace(/\.pdf$/i, '') : ''}
              />
            )}

          {/* Chat Panel */}
          {!showLibrary && (
            <>
              {/* Resize Handle */}
              {showChat && (
                <div 
                    className="w-1 h-full bg-gray-200 hover:bg-blue-400 cursor-col-resize z-10 flex-shrink-0"
                  onMouseDown={startChatDragging}
                ></div>
              )}
              
              {/* Chat Panel with dynamic width */}
              <div 
                  className={`border-l transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col ${showChat ? '' : 'w-0'}`}
                  style={{ 
                    width: showChat ? `${chatPanelWidth}px` : '0px',
                    height: '100%',
                    maxHeight: 'calc(100vh - 42px)' // Subtract title bar height
                  }}
              >
                {showChat ? (
                    <div className="h-full flex flex-col overflow-hidden">
                  <ChatPanel 
                    conversation={currentConversation} 
                    onCitationClick={handleCitationClick}
                  />
                    </div>
                  ) : null}
                      </div>
            </>
          )}
          </div>
                    </div>
      </div>

      {/* Download Dialog rendered at root level */}
      <DownloadDialog 
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        onDownload={handleDownload}
      />

      {/* At the end of the return before the closing tag */}
      <style dangerouslySetInnerHTML={{ __html: loaderStyle }} />
    </div>
  );
}

export default function AnaraViewerWithExtras() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="loader-gray"></div>
          <p className="mt-3 text-sm text-gray-600">Loading document viewer...</p>
        </div>
      </div>
    }>
      <AnaraViewerContent />
    </Suspense>
  );
} 