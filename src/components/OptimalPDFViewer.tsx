'use client';

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
import { useState, useEffect, useRef, useMemo } from "react";
import { useDebounce } from "use-debounce";

// Add loader style
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

// Download Dialog Component
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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-100"
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

// Simple page navigation
function PageNavigation() {
  const currentPage = usePdf((state) => state.currentPage);
  const numPages = usePdf((state) => state.pdfDocumentProxy.numPages);
  const { jumpToPage } = usePdfJump();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      console.log('Navigating to previous page with jumpToPage:', currentPage - 1);
      jumpToPage(currentPage - 1, { behavior: "auto" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      console.log('Navigating to next page with jumpToPage:', currentPage + 1);
      jumpToPage(currentPage + 1, { behavior: "auto" });
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handlePreviousPage}
        disabled={currentPage <= 1}
        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
        aria-label="Previous page"
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
        aria-label="Next page"
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

// Enhanced sidebar component that matches the provided design
function EnhancedSidebar({ isOpen }: { isOpen: boolean }) {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'search'>('search');
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 300);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLimit, setSearchLimit] = useState(10);
  const [searchResults, setSearchResults] = useState<{
    exactMatches: SearchResult[];
    fuzzyMatches: SearchResult[];
    hasMoreResults: boolean;
  }>({
    exactMatches: [],
    fuzzyMatches: [],
    hasMoreResults: false
  });
  
  const { search } = useSearch();
  const setCurrentPage = usePdf((state) => state.setCurrentPage);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Set up listener for thumbnail clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Check if we clicked on a thumbnail
      const target = e.target as HTMLElement;
      const thumbnail = target.closest('[data-page-number]');
      
      if (thumbnail) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get the page number from the data attribute
        const pageNumber = parseInt(thumbnail.getAttribute('data-page-number') || '0', 10);
        if (pageNumber > 0) {
          // Trigger the same custom event that the PageNavigation component uses
          document.dispatchEvent(new CustomEvent('pagechange'));
          
          // Direct page change without animation
          setCurrentPage(pageNumber);
        }
      }
    };

    // Add click handler to thumbnails container
    const container = thumbnailsRef.current;
    if (container) {
      container.addEventListener('click', handleClick as EventListener);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleClick as EventListener);
      }
    };
  }, [setCurrentPage]);

  // Perform search when text changes or limit changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchText.trim()) {
        setSearchResults({
          exactMatches: [],
          fuzzyMatches: [],
          hasMoreResults: false
        });
        return;
      }

      try {
        setIsSearching(true);
        const results = await search(debouncedSearchText, { limit: searchLimit });
        setSearchResults({
          exactMatches: results.exactMatches || [],
          fuzzyMatches: results.fuzzyMatches || [],
          hasMoreResults: results.hasMoreResults || false
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchText, searchLimit, search]);

  // Handle loading more results
  const handleLoadMore = () => {
    // Increase the limit to load more results
    setSearchLimit(prevLimit => prevLimit + 10);
  };

  const totalResults = (searchResults.exactMatches?.length || 0) + (searchResults.fuzzyMatches?.length || 0);

  return (
    <div 
      className="absolute inset-y-0 left-0 z-20 w-64 border-r border-border bg-background h-full overflow-hidden transition-transform duration-300 ease-in-out" 
      style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
    >
      <div className="py-3">
        <div 
          role="group" 
          dir="ltr" 
          className="flex items-center gap-1 px-3 justify-between" 
          tabIndex={0}
        >
          <button 
            type="button" 
            role="radio" 
            aria-checked={activeTab === 'thumbnails'}
            data-state={activeTab === 'thumbnails' ? "on" : "off"}
            className="inline-flex items-center justify-center rounded-md text-sm text-textGray4 font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-3 flex-1"
            onClick={() => setActiveTab('thumbnails')}
          >
            Thumbnails
          </button>
          <button 
            type="button" 
            role="radio" 
            aria-checked={activeTab === 'search'}
            data-state={activeTab === 'search' ? "on" : "off"}
            className="inline-flex items-center justify-center rounded-md text-sm text-textGray4 font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-3 flex-1"
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
        </div>
      </div>
      
      <div className="h-full overflow-auto pb-16">
        <div className="overflow-y-auto h-full overflow-x-hidden">
          {activeTab === 'thumbnails' && (
            <div className="h-full" ref={thumbnailsRef}>
              <Thumbnails className="flex flex-col gap-2 items-center p-4">
                <Thumbnail className="w-48 transition-all hover:shadow hover:outline hover:outline-gray-200 rounded-sm cursor-pointer" />
              </Thumbnails>
            </div>
          )}
          
          {activeTab === 'search' && (
            <div className="w-full h-full overflow-x-hidden px-3">
              <div className="flex h-full w-full gap-1 flex-col overflow-hidden rounded-md text-popover-foreground bg-background">
                <div className="flex items-center bg-accent rounded-md px-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search mr-2 h-4 w-4 shrink-0 opacity-50">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  <input 
                    className="flex h-[32px] w-full font-medium rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50" 
                    placeholder="Search in the document..." 
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                
                <div className="overflow-y-auto overflow-x-hidden max-h-[unset] mt-2">
                  {isSearching ? (
                    <div className="text-sm text-center py-4 flex items-center justify-center">
                      <span className="loader-gray mr-2" style={{ width: '16px', height: '16px' }}></span>
                      <span>Searching...</span>
                    </div>
                  ) : !searchText ? (
                    <div className="text-sm text-center py-4">Enter text to search</div>
                  ) : totalResults === 0 ? (
                    <div className="text-sm text-center py-4">No results found</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 px-2">
                        {totalResults} results found
                      </div>
                      <div className="divide-y">
                        {searchResults.exactMatches?.map((result) => (
                          <ResultItem
                            key={`exact-${result.pageNumber}-${result.matchIndex}`}
                            result={result}
                            type="exact"
                          />
                        ))}
                        {searchResults.fuzzyMatches?.map((result) => (
                          <ResultItem
                            key={`fuzzy-${result.pageNumber}-${result.matchIndex}`}
                            result={result}
                            type="fuzzy"
                          />
                        ))}
                      </div>
                      
                      {/* Load More Button */}
                      {searchResults.hasMoreResults && (
                        <button
                          onClick={handleLoadMore}
                          disabled={isSearching}
                          className="w-full mt-2 py-2 px-3 text-sm bg-accent/50 hover:bg-accent/70 rounded text-accent-foreground transition-colors flex items-center justify-center"
                        >
                          {isSearching ? (
                            <>
                              <span className="loader-gray mr-2" style={{ width: '16px', height: '16px' }}></span>
                              Loading...
                            </>
                          ) : (
                            'Load More Results'
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Optimized PDF content with selection
function PDFContent({ highlightPosition }: { highlightPosition?: any }) {
  const selectionDimensions = useSelectionDimensions();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);
  const [autoHighlight, setAutoHighlight] = useState(false);
  const { jumpToHighlightRects } = usePdfJump();

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
      jumpToHighlightRects(rects, "pixels");
    } catch (error) {
      console.error("Error highlighting text:", error);
      // Fallback to the standard highlighting if precise method fails
      jumpToHighlightRects(dimension.highlights, "pixels");
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
    <Pages className="w-full h-full overflow-auto">
      <Page className="pdf-page flex flex-col items-center">
        {/* Order is important: Canvas first, Text second */}
        <div className="relative w-full">
          <CanvasLayer className="max-w-full" />
          <TextLayer className="max-w-full" />
          <HighlightLayer className="bg-yellow-200/70" />
          
          {/* Custom highlight div for citations */}
          {highlightPosition && (
            <div
              style={{
                position: 'absolute',
                left: `${highlightPosition.left}px`,
                top: `${highlightPosition.top}px`,
                width: `${highlightPosition.width}px`,
                height: `${highlightPosition.height}px`,
                backgroundColor: 'rgba(255, 255, 0, 0.4)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            />
          )}
        </div>
        
        {/* Selection tooltip */}
        <SelectionTooltip>
          <div 
            className="fixed flex gap-1.5 bg-white shadow-lg rounded-md" 
            style={{ 
              transform: 'scale(1)', 
              transformOrigin: 'top left',
              padding: '6px',
              fontSize: '11px',
              lineHeight: '14px',
              width: 'fit-content',
              height: 'fit-content',
              zIndex: 10000
            }}
          >
            <button
              className="rounded whitespace-nowrap bg-yellow-100 hover:bg-yellow-200"
              style={{ 
                fontSize: 'inherit',
                padding: '4px 10px',
                lineHeight: 'inherit'
              }}
              onClick={handlePreciseHighlight}
            >
              Highlight
            </button>
            <button
              className={cn(
                "rounded whitespace-nowrap",
                autoHighlight 
                  ? 'bg-green-100 hover:bg-green-200' 
                  : 'bg-gray-100 hover:bg-gray-200'
              )}
              style={{ 
                fontSize: 'inherit',
                padding: '4px 10px',
                lineHeight: 'inherit'
              }}
              onClick={() => setAutoHighlight(!autoHighlight)}
            >
              {autoHighlight ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>
        </SelectionTooltip>
      </Page>
    </Pages>
  );
}

// Main PDF viewer with correct container structure for both selection and scrolling
export default function OptimalPDFViewer({ 
  pdfUrl = "/pdf/document.pdf", 
  highlightPosition = null 
}: { 
  pdfUrl?: string;
  highlightPosition?: {
    pageNumber: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Use ref to track current highlight position
  const highlightRef = useRef(highlightPosition);
  
  // Add a ref to track the PDF content container
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Extract document title from URL
  const documentTitle = useMemo(() => {
    const filename = pdfUrl.split('/').pop() || 'document.pdf';
    const title = filename.replace(/\.pdf$/i, '');
    return title.length > 96 ? title.substring(0, 96) + '...' : title;
  }, [pdfUrl]);
  
  // Update ref when prop changes
  useEffect(() => {
    highlightRef.current = highlightPosition;
  }, [highlightPosition]);

  // Prevent automatic scrolling after page changes
  useEffect(() => {
    // Store the last known scroll position
    let lastScrollTop = 0;
    let isChangingPage = false;
    
    // Create a mutation observer to detect when page is changing
    const observer = new MutationObserver((mutations) => {
      // If we're not actively changing pages, store the current scroll position
      if (!isChangingPage && pdfContainerRef.current) {
        lastScrollTop = pdfContainerRef.current.scrollTop;
      }
    });
    
    // Function to restore scroll position
    const restoreScrollPosition = () => {
      if (pdfContainerRef.current && isChangingPage) {
        // Apply the scroll position immediately and after a short delay to ensure it takes effect
        pdfContainerRef.current.scrollTop = 0;
        
        setTimeout(() => {
          if (pdfContainerRef.current) {
            pdfContainerRef.current.scrollTop = 0;
          }
          isChangingPage = false;
        }, 50);
      }
    };
    
    // Set up listeners for page change events
    const handlePageChange = () => {
      isChangingPage = true;
      restoreScrollPosition();
    };
    
    // Start observing page changes
    if (pdfContainerRef.current) {
      observer.observe(pdfContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      // Listen for custom events or use the usePdf hook to detect page changes
      document.addEventListener('pagechange', handlePageChange);
    }
    
    // Preserve scroll position on resize
    const preserveScrollPosition = () => {
      if (!pdfContainerRef.current) return;
      
      // Store current scroll position before resize affects it
      const scrollTop = pdfContainerRef.current.scrollTop;
      const scrollLeft = pdfContainerRef.current.scrollLeft;
      
      // Apply the scroll position after the resize is complete
      requestAnimationFrame(() => {
        if (pdfContainerRef.current) {
          pdfContainerRef.current.scrollTop = scrollTop;
          pdfContainerRef.current.scrollLeft = scrollLeft;
        }
      });
    };
    
    // Listen for resize events
    window.addEventListener('resize', preserveScrollPosition);
    
    return () => {
      observer.disconnect();
      document.removeEventListener('pagechange', handlePageChange);
      window.removeEventListener('resize', preserveScrollPosition);
    };
  }, []);

  // Verify the PDF URL is valid and log it
  useEffect(() => {
    if (pdfUrl) {
      console.log('PDF Viewer received URL:', pdfUrl.substring(0, 50) + '...');
      
      // Check if the URL is accessible
      const checkUrl = async () => {
        try {
          const response = await fetch(pdfUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.error('PDF URL is not accessible, status:', response.status);
            setLoadError(`Unable to load PDF (status ${response.status}). The URL may have expired or is not publicly accessible.`);
          } else {
            console.log('PDF URL is accessible');
            setLoadError(null);
          }
        } catch (error) {
          console.error('Error checking PDF URL:', error);
          setLoadError('Error accessing PDF URL. There may be a CORS issue or the URL is invalid.');
        }
      };
      
      checkUrl();
    }
  }, [pdfUrl]);

  const handleDownload = (filename: string) => {
    console.log('Downloading PDF with URL:', pdfUrl.substring(0, 50) + '...');
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Add global CSS to fix PDF scrolling and zooming
    const style = document.createElement('style');
    style.innerHTML = `
      .pdf-page {
        margin: 1rem auto !important;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }

      /* Ensure proper scrolling */
      .textLayer, .canvasWrapper {
        position: relative !important;
        overflow: visible !important;
        transform-origin: top left !important;
      }

      /* Ensure highlight layer matches text layer */
      .anara-highlight-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      /* Fix zoom behavior */
      .pdf-container {
        contain: size layout;
        overflow: auto;
      }

      /* Ensure PDF pages stack vertically */
      .lector-root {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
      }
      
      /* Prevent scroll reset on resize */
      .pdf-content-container {
        overflow: auto;
        height: 100%;
        position: relative;
        contain: strict;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Scroll to highlighted position when it changes
  useEffect(() => {
    if (highlightPosition) {
      const scrollToHighlight = async () => {
        try {
          const { jumpToHighlightRects } = usePdfJump();
          
          // Use the correct format for HighlightRect
          jumpToHighlightRects([{
            pageNumber: highlightPosition.pageNumber,
            left: highlightPosition.left,
            top: highlightPosition.top,
            width: highlightPosition.width,
            height: highlightPosition.height
          }], "pixels");
        } catch (error) {
          console.error('Error scrolling to highlight:', error);
        }
      };
      
      scrollToHighlight();
    }
  }, [highlightPosition]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* PDF Viewer Content - Fills remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loadError ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-red-500">{loadError}</div>
            <p className="mb-4">This can happen when:</p>
            <ul className="text-left list-disc pl-8 mb-6">
              <li>The signed URL has expired</li>
              <li>The bucket permissions are not configured correctly</li>
              <li>There are CORS issues with the storage bucket</li>
            </ul>
            <button 
              onClick={() => setLoadError(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        ) : (
          <Root 
            source={pdfUrl} 
            className="h-full bg-background border-0 shadow-none overflow-hidden flex flex-col"
            loader={
              <div className="w-full h-full flex items-center justify-center">
                <span className="loader-gray mt-[0.3rem]"></span>
              </div>
            }
            isZoomFitWidth={true}
            style={{ contain: 'content' }}
            onError={(error: any) => {
              console.error('PDF.js error:', error);
              setLoadError(`Error loading PDF: ${error?.message || 'Unknown error'}`);
            }}
          >
            <Search>
              {/* Top Bar - Made sticky */}
              <div className="sticky top-0 z-[50] p-2 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="inline-flex items-center relative gap-2 font-semibold justify-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-accent-foreground bg-transparent h-9 w-9"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M9 3v18" />
                    </svg>
                  </button>
                </div>

                {/* Centered Page Navigation */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <PageNavigation />
                </div>

                {/* Document Menu and Zoom Controls */}
                <div className="flex items-center space-x-4">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1">
                    <ZoomOut className="h-9 w-9 bg-transparent hover:bg-muted rounded-md p-1.5 cursor-pointer flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </ZoomOut>
                    <ZoomIn className="h-9 w-9 bg-transparent hover:bg-muted rounded-md p-1.5 cursor-pointer flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </ZoomIn>
                  </div>
                  
                  {/* Download Button */}
                  <button 
                    onClick={() => {
                      // Extract filename from URL or use default
                      const defaultFilename = pdfUrl.split('/').pop() || 'document.pdf';
                      // Download directly without showing dialog
                      handleDownload(defaultFilename);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded h-9 w-9 flex items-center justify-center"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Content Area - Modified for better layout */}
              <div className="flex-1 relative overflow-hidden">
                {/* Always render sidebar but control with isOpen prop */}
                <EnhancedSidebar isOpen={showSidebar} />
                
                {/* PDF View Area */}
                <div className="h-full overflow-auto pdf-content-container" ref={pdfContainerRef}>
                  <PDFContent highlightPosition={highlightRef.current} />
                </div>
              </div>
            </Search>
          </Root>
        )}
      </div>

      {/* Download Dialog rendered at root level */}
      <DownloadDialog 
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        onDownload={handleDownload}
      />
      
      {/* Add style tag for loader */}
      <style dangerouslySetInnerHTML={{ __html: loaderStyle }} />
    </div>
  );
} 