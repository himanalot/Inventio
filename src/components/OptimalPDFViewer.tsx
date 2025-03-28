'use client';

import '@/lib/polyfills';

import {
  CanvasLayer,
  CurrentPage,
  CurrentZoom,
  Page,
  Pages,
  Root,
  TextLayer,
  ZoomIn,
  ZoomOut,
  Thumbnail,
  Thumbnails,
  Search,
  HighlightLayer,
  usePdf,
  usePdfJump,
  useSelectionDimensions,
  SelectionTooltip,
  useSearch,
  SearchResult,
  calculateHighlightRects
} from "@anaralabs/lector";
import "pdfjs-dist/web/pdf_viewer.css";
import "@/lib/setup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";
import MobileDetectionOverlay from "@/components/MobileDetectionOverlay";
import LoginDialog from "@/components/auth/LoginDialog";
import { getCurrentUser } from '@/lib/supabase';

// Simple page navigation
function PageNavigation() {
  const currentPage = usePdf((state) => state.currentPage);
  const numPages = usePdf((state) => state.pdfDocumentProxy.numPages);
  const setCurrentPage = usePdf((state) => state.setCurrentPage);
  const { jumpToPage } = usePdfJump();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      // Direct page change without animation
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      // Direct page change without animation
      setCurrentPage(currentPage + 1);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handlePreviousPage}
        disabled={currentPage <= 1}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <span className="text-sm font-medium">
        {currentPage} / {numPages}
      </span>
      
      <button 
        onClick={handleNextPage}
        disabled={currentPage >= numPages}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

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

// Search panel component
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

// Thumbnails section
function ThumbnailsSection() {
  const { jumpToPage } = usePdfJump();
  
  return (
    <div className="h-full overflow-auto">
      <Thumbnails className="flex flex-col gap-2 items-center p-4">
        <Thumbnail className="w-48 transition-all hover:shadow hover:outline hover:outline-gray-200 rounded-sm cursor-pointer" />
      </Thumbnails>
    </div>
  );
}

// Optimized PDF content with selection and proper scrolling
function PDFContent() {
  const selectionDimensions = useSelectionDimensions();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);
  const setHighlights = usePdf((state) => state.setHighlight);
  const [autoHighlight, setAutoHighlight] = useState(false);

  // Function to handle text selection and precise highlighting
  const handlePreciseHighlight = async () => {
    const dimension = selectionDimensions.getDimension();
    if (!dimension || dimension.isCollapsed || !dimension.text) return;

    try {
      // Get the page proxy
      const pageProxy = await getPdfPageProxy(dimension.highlights[0].pageNumber);
      if (!pageProxy) return;

      // Use the search functionality's text finding logic to ensure precision
      const rects = await calculateHighlightRects(pageProxy, {
        pageNumber: dimension.highlights[0].pageNumber,
        text: dimension.text,
        matchIndex: 0,
      });

      // Apply the highlights with the precisely calculated rectangles
      setHighlights(rects);
    } catch (error) {
      console.error("Error highlighting text:", error);
      // Fallback to the standard highlighting if precise method fails
      setHighlights(dimension.highlights);
    }
  };

  // Auto-highlight selected text when enabled
  useEffect(() => {
    if (!autoHighlight) return;
    
    const handleSelection = () => {
      handlePreciseHighlight();
    };
    
    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [autoHighlight]);

  return (
    <Pages className="w-full h-full">
      <Page>
        {/* This is the key part for proper text selection */}
        {/* Order is important: Canvas first, Text second */}
        <CanvasLayer />
        <TextLayer />
        
        {/* Selection tooltip */}
        <SelectionTooltip>
          <div className="flex gap-2 bg-white shadow-lg rounded-md p-2">
            <button
              className="text-xs px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded"
              onClick={handlePreciseHighlight}
            >
              Highlight
            </button>
            <button
              className={`text-xs px-3 py-1 rounded ${
                autoHighlight 
                  ? 'bg-green-100 hover:bg-green-200' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setAutoHighlight(!autoHighlight)}
            >
              {autoHighlight ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>
        </SelectionTooltip>
        
        {/* Layer that shows the highlights */}
        <HighlightLayer className="bg-yellow-200/70" />
      </Page>
    </Pages>
  );
}

// Main PDF viewer with correct container structure for both selection and scrolling
export default function OptimalPDFViewer() {
  const [pdfUrl, setPdfUrl] = useState('/pdf/document.pdf');
  const [activeSidebar, setActiveSidebar] = useState<'thumbnails' | 'search'>('thumbnails');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  
  // Get the current user when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setShowLoginDialog(false);
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
  
  // Check if the URL is accessible
  useEffect(() => {
    // ... rest of the effect remains the same ...
  }, [pdfUrl]);

  return (
    <div className="flex flex-col gap-8 p-4">
      {/* Mobile Detection Overlay */}
      <MobileDetectionOverlay />

      {/* Login Dialog - Force login for PDF viewer */}
      <LoginDialog 
        isOpen={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        enforceLogin={true}
      />

      <div className="h-[calc(100vh-8rem)]">
        <Root 
          source={pdfUrl} 
          className="h-full bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col"
          loader={<div className="p-8 text-center">Loading PDF...</div>}
          isZoomFitWidth={true}
        >
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-1.5 min-w-7 gap-1.5"
                  onClick={() => setShowSidebar(!showSidebar)}
                  data-state={showSidebar ? "on" : "off"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-list">
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                    <path d="M14 4h7" />
                    <path d="M14 9h7" />
                    <path d="M14 15h7" />
                    <path d="M14 20h7" />
                  </svg>
                  <span>Thumbnails</span>
                </Button>
                
                <Button 
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-1.5 min-w-7 gap-1.5"
                  onClick={() => setActiveSidebar('search')}
                  data-state={activeSidebar === 'search' ? "on" : "off"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span>Search</span>
                </Button>
              </div>
              
              {/* Centered Page Navigation */}
              <PageNavigation />
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <ZoomOut className="h-7 w-7 bg-transparent hover:bg-muted rounded-md p-1 cursor-pointer" />
                <CurrentZoom className="text-sm w-14 text-center" />
                <ZoomIn className="h-7 w-7 bg-transparent hover:bg-muted rounded-md p-1 cursor-pointer" />
              </div>
            </div>
            
            {/* Content Area - Simplified structure for better scrolling */}
            <div className="flex-1 overflow-hidden flex">
              {/* Thumbnails Panel */}
              <div className={cn(
                "bg-background border-r overflow-y-auto transition-all duration-300",
                showSidebar ? "w-60" : "w-0"
              )}>
                <ThumbnailsSection />
              </div>

              {/* PDF Content - Direct containment for proper scrolling */}
              <div className={cn(
                "flex-1 relative",
                activeSidebar === 'search' ? "border-r" : ""
              )}>
                <PDFContent />
              </div>

              {/* Search Panel */}
              <div className={cn(
                "bg-background border-l overflow-hidden transition-all duration-300",
                activeSidebar === 'search' ? "w-80" : "w-0"
              )}>
                <SearchPanel />
              </div>
            </div>
          </div>
        </Root>
      </div>
    </div>
  );
} 