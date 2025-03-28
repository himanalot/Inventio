'use client';

import '@/lib/polyfills';

import {
  CanvasLayer,
  CurrentPage,
  CurrentZoom,
  HighlightLayer,
  Page,
  Pages,
  Root,
  Search,
  TextLayer,
  Thumbnail,
  Thumbnails,
  ZoomIn,
  ZoomOut,
  usePdf,
  usePdfJump,
  useSearch,
  SearchResult,
  calculateHighlightRects
} from "@anaralabs/lector";
import { useDebounce } from "use-debounce";
import "pdfjs-dist/web/pdf_viewer.css";
import "@/lib/setup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

/**
 * Complete PDF Viewer implementation with all features:
 * - Basic PDF rendering with Canvas and Text layers
 * - Thumbnail navigation
 * - Page navigation controls
 * - Zoom controls 
 * - Search functionality
 * - Highlight support
 */
export default function CompletePDFViewer() {
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="h-[calc(100vh-8rem)]">
        <Root 
          source="/89f0a20f-6750-4cd3-bec2-e573bc84efe4.pdf" 
          className="h-full bg-background rounded-xl border shadow-sm overflow-hidden flex flex-col"
          loader={<div className="p-8 text-center">Loading PDF...</div>}
        >
          <Search>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-1.5 min-w-7 gap-1.5"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  data-state={showThumbnails ? "on" : "off"}
                >
                  <MenuIcon className="h-4 w-4" />
                  <span>Thumbnails</span>
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-muted data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-7 px-1.5 min-w-7 gap-1.5"
                  onClick={() => setShowSearch(!showSearch)}
                  data-state={showSearch ? "on" : "off"}
                >
                  <SearchIcon className="h-4 w-4" />
                  <span>Search</span>
                </Button>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <ZoomOut>
                      <MinusIcon className="h-3 w-3" />
                    </ZoomOut>
                  </Button>
                  <CurrentZoom className="w-16 text-center bg-muted px-2 py-1 text-sm rounded-md" />
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <ZoomIn>
                      <PlusIcon className="h-3 w-3" />
                    </ZoomIn>
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <PageNavigation />
                <DocumentPositionTracker />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-muted/30">
              <div className={cn(
                "grid h-full transition-all duration-300",
                showSearch 
                  ? showThumbnails 
                    ? "grid-cols-[240px,1fr,320px]" 
                    : "grid-cols-[0px,1fr,320px]"
                  : showThumbnails 
                    ? "grid-cols-[240px,1fr,0px]" 
                    : "grid-cols-[0px,1fr,0px]"
              )}>
                {/* Thumbnails Panel */}
                <div className={cn(
                  "bg-background border-r overflow-y-auto transition-all duration-300",
                  showThumbnails ? "w-60" : "w-0"
                )}>
                  <ThumbnailsSection />
                </div>

                {/* PDF Content */}
                <div className="overflow-auto">
                  <div className="min-h-full flex items-start justify-center p-6">
                    <div className="inline-block bg-white rounded-lg shadow-lg">
                      <Pages>
                        <Page>
                          <CanvasLayer className="mix-blend-multiply" />
                          <TextLayer className="mix-blend-multiply" />
                          <HighlightLayer className="bg-yellow-200/70" />
                        </Page>
                      </Pages>
                    </div>
                  </div>
                </div>

                {/* Search Panel */}
                <div className={cn(
                  "bg-background border-l overflow-hidden transition-all duration-300",
                  showSearch ? "w-80" : "w-0"
                )}>
                  <SearchUI />
                </div>
              </div>
            </div>
          </Search>
        </Root>
      </div>
    </div>
  );
}

// Enhanced navigation with direct virtualized scrolling
function PageNavigation() {
  const pdfDocumentProxy = usePdf((state) => (state as any).pdfDocumentProxy);
  const currentPage = usePdf((state) => state.currentPage);
  const setCurrentPage = usePdf((state) => state.setCurrentPage);
  const [pageNumber, setPageNumber] = useState<string | number>(currentPage);
  const { jumpToPage } = usePdfJump();
  const totalPages = pdfDocumentProxy?.numPages || 0;
  const virtualizer = usePdf((state) => (state as any).virtualizer);
  const viewportRef = usePdf((state) => (state as any).viewportRef);
  const zoom = usePdf((state) => state.zoom);

  // Interface for virtualizer items
  interface VirtualItem {
    index: number;
    start: number;
    end: number;
    size: number;
  }

  // Combined approach for reliable navigation
  const navigateToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    // 1. Update Lector's internal state
    setCurrentPage(page);
    
    // 2. Get the viewport element
    const viewport = viewportRef?.current;
    
    if (viewport && virtualizer) {
      try {
        // 3. Get the page item from the virtualizer - it has the exact position
        const pageIndex = page - 1; // Convert to 0-indexed
        const items = virtualizer.getVirtualItems();
        const targetItem = items.find((item: VirtualItem) => item.index === pageIndex);
        
        if (targetItem) {
          // 4. Get the exact pixel position, accounting for zoom
          const scrollPosition = targetItem.start * zoom;
          
          // 5. Scroll directly to that position
          viewport.scrollTo({
            top: scrollPosition,
            behavior: 'auto'
          });
          
          // 6. Redundant approach with virtualizer
          setTimeout(() => {
            if (virtualizer.scrollToIndex) {
              virtualizer.scrollToIndex(pageIndex, { align: 'start', behavior: 'auto' });
            }
          }, 10);
        } else {
          // Item not found, try direct index method
          if (virtualizer.scrollToIndex) {
            virtualizer.scrollToIndex(page - 1, { align: 'start', behavior: 'auto' });
          }
        }
      } catch (error) {
        console.error("Navigation error:", error);
        
        // Last resort fallback
        jumpToPage(page, { behavior: "auto", align: "start" });
      }
    } else {
      // If viewport or virtualizer not available, use the API
      jumpToPage(page, { behavior: "auto", align: "start" });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      navigateToPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      navigateToPage(currentPage + 1);
    }
  };

  useEffect(() => {
    setPageNumber(currentPage);
  }, [currentPage]);

  const handlePageInput = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    const value = Number(e.currentTarget.value);
    if (value >= 1 && value <= totalPages && currentPage !== value) {
      navigateToPage(value);
    } else {
      setPageNumber(currentPage);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={handlePreviousPage}
        disabled={currentPage <= 1}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          onBlur={handlePageInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePageInput(e);
              e.currentTarget.blur();
            }
          }}
          className="[appearance:textfield] w-10 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center bg-muted border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-md"
        />
        <span className="text-sm text-muted-foreground font-medium">/ {totalPages || '?'}</span>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Track PDF document position
function DocumentPositionTracker() {
  const currentPage = usePdf((state) => state.currentPage);
  const virtualizer = usePdf((state) => (state as any).virtualizer);
  const pdfDocumentProxy = usePdf((state) => (state as any).pdfDocumentProxy);
  const totalPages = pdfDocumentProxy?.numPages || 0;
  const [scrollPercentage, setScrollPercentage] = useState(0);
  
  // Effect to track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!virtualizer?.scrollElement) return;
      
      const { scrollTop, scrollHeight, clientHeight } = virtualizer.scrollElement;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return;
      
      const percentage = (scrollTop / maxScroll) * 100;
      setScrollPercentage(Math.min(100, Math.max(0, percentage)));
    };
    
    // Find the scrollable container
    const scrollElement = virtualizer?.scrollElement;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      
      // Initial value
      handleScroll();
    }
    
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [virtualizer]);
  
  return (
    <div className="text-xs p-2 bg-muted/30 rounded border mt-2 space-y-1 max-w-[200px]">
      <div className="flex justify-between items-center">
        <span className="font-medium">Position</span>
        <span>{currentPage} / {totalPages || '?'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Scroll:</span>
        <div className="w-full bg-muted rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full" 
            style={{ width: `${scrollPercentage}%` }}
          />
        </div>
        <span>{Math.round(scrollPercentage)}%</span>
      </div>
    </div>
  );
}

// Thumbnails section with clean click handling
function ThumbnailsSection() {
  const { jumpToPage } = usePdfJump();
  const setCurrentPage = usePdf((state) => state.setCurrentPage);
  const virtualizer = usePdf((state) => (state as any).virtualizer);
  const viewportRef = usePdf((state) => (state as any).viewportRef);
  const zoom = usePdf((state) => state.zoom);
  
  // Create a ref to hold the container element
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);

  // Interface for virtualizer items
  interface VirtualItem {
    index: number;
    start: number;
    end: number;
    size: number;
  }

  // Direct navigation implementation
  const navigateToPage = (pageNumber: number) => {
    if (pageNumber < 1) return;
    
    // 1. Update Lector's internal state
    setCurrentPage(pageNumber);
    
    // 2. Get the viewport element - this is the actual scrollable container in Lector
    const viewport = viewportRef?.current;
    
    if (viewport && virtualizer) {
      try {
        // 3. Get the page item from the virtualizer - it has the exact position
        const pageIndex = pageNumber - 1; // Convert to 0-indexed
        const items = virtualizer.getVirtualItems();
        const targetItem = items.find((item: VirtualItem) => item.index === pageIndex);
        
        if (targetItem) {
          // 4. Get the exact pixel position, accounting for zoom
          const scrollPosition = targetItem.start * zoom;
          
          // 5. Scroll directly to that position
          viewport.scrollTo({
            top: scrollPosition,
            behavior: 'auto'
          });
          
          // 6. Redundant approach with virtualizer
          setTimeout(() => {
            if (virtualizer.scrollToIndex) {
              virtualizer.scrollToIndex(pageIndex, { align: 'start', behavior: 'auto' });
            }
          }, 10);
        } else {
          // Item not found, try direct index method
          if (virtualizer.scrollToIndex) {
            virtualizer.scrollToIndex(pageIndex, { align: 'start', behavior: 'auto' });
          }
        }
      } catch (error) {
        console.error("Navigation error:", error);
        
        // Last resort fallback
        jumpToPage(pageNumber, { behavior: "auto", align: "start" });
      }
    } else {
      // If viewport or virtualizer not available, use the API
      jumpToPage(pageNumber, { behavior: "auto", align: "start" });
    }
  };

  const handleCanvasClick = async (event: MouseEvent) => {
    const canvas = event.target as HTMLElement;
    if (canvas.tagName === 'CANVAS' && canvas.getAttribute('role') === 'button') {
      // Try to find the page number from the canvas element
      const canvasElements = thumbnailsContainerRef.current?.querySelectorAll('canvas[role="button"]');
      if (canvasElements) {
        const canvasArray = Array.from(canvasElements);
        const clickedIndex = canvasArray.indexOf(canvas as HTMLCanvasElement);
        
        if (clickedIndex !== -1) {
          // Page numbers are 1-indexed, whereas array indices are 0-indexed
          const pageNumber = clickedIndex + 1;
          navigateToPage(pageNumber);
        }
      }
    }
  };

  useEffect(() => {
    // Add event listener to the thumbnails container
    const container = thumbnailsContainerRef.current;
    if (container) {
      container.addEventListener('click', handleCanvasClick);
    }

    // Clean up event listener on unmount
    return () => {
      if (container) {
        container.removeEventListener('click', handleCanvasClick);
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h3 className="font-medium mb-4">Thumbnails</h3>
      <div ref={thumbnailsContainerRef}>
        <Thumbnails className="flex flex-col gap-2 items-center">
          <Thumbnail className="w-[200px] transition-all hover:shadow-lg hover:outline hover:outline-primary cursor-pointer rounded-sm" />
        </Thumbnails>
      </div>
    </div>
  );
}

// Result item for search results
interface ResultItemProps {
  result: SearchResult;
  type: 'exact' | 'fuzzy';
}

// Individual search result item
const ResultItem = ({ result, type }: ResultItemProps) => {
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
      className="flex py-2 hover:bg-muted/50 flex-col cursor-pointer px-2 rounded-md"
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
          <span className="text-xs text-muted-foreground">Page {result.pageNumber}</span>
        </div>
      </div>
    </div>
  );
};

// Search results component
interface SearchResultsProps {
  searchText: string;
  exactMatches: SearchResult[];
  fuzzyMatches: SearchResult[];
  onLoadMore: () => void;
  isSearching: boolean;
  hasMoreResults: boolean;
}

// Display search results
function SearchResults({ 
  searchText, 
  exactMatches, 
  fuzzyMatches, 
  onLoadMore, 
  isSearching,
  hasMoreResults 
}: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Searching...
      </div>
    );
  }

  if (!searchText) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Type to search in document
      </div>
    );
  }

  const totalResults = (exactMatches?.length || 0) + (fuzzyMatches?.length || 0);

  if (totalResults === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No results found for "{searchText}"
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        Found {totalResults} results
      </div>
      <div className="divide-y divide-border">
        {exactMatches?.map((result) => (
          <ResultItem
            key={`exact-${result.pageNumber}-${result.matchIndex}`}
            result={result}
            type="exact"
          />
        ))}
        {fuzzyMatches?.map((result) => (
          <ResultItem
            key={`fuzzy-${result.pageNumber}-${result.matchIndex}`}
            result={result}
            type="fuzzy"
          />
        ))}
      </div>
      {hasMoreResults && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Load more results
        </button>
      )}
    </div>
  );
}

// Search UI component
function SearchUI() {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(searchText);
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

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in document..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 rounded-md border-0 ring-1 ring-inset ring-border focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <SearchResults
            searchText={searchText}
            exactMatches={searchState.exactMatches}
            fuzzyMatches={searchState.fuzzyMatches}
            hasMoreResults={searchState.hasMoreResults}
            onLoadMore={handleLoadMore}
            isSearching={isSearching}
          />
        </div>
      </div>
    </div>
  );
}

// --- UI Icons ---

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-6-6" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14m-7-7h14" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
} 