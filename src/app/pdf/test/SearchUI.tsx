'use client';

import { useDebounce } from "use-debounce";
import {
  calculateHighlightRects,
  SearchResult,
  usePdf,
  usePdfJump,
  useSearch,
} from "@anaralabs/lector";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ResultItemProps {
  result: SearchResult;
  type: 'exact' | 'fuzzy';
}

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

interface SearchResultsProps {
  searchText: string;
  exactMatches: SearchResult[];
  fuzzyMatches: SearchResult[];
  onLoadMore: () => void;
  isSearching: boolean;
  hasMoreResults: boolean;
}

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

export function SearchUI() {
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
      console.log(`Searching for '${searchValue}' with limit ${searchLimit}`);
      setIsSearching(true);
      const response = await search(searchValue, { limit: searchLimit });
      console.log('Search response:', response);
      
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
  }, [debouncedSearchText, search]);

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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-6-6" />
    </svg>
  );
} 