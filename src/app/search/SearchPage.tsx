"use client";

import React, { useState } from 'react';
import { SearchForm } from './SearchForm';
import { TutoringSessionCard } from './TutoringSessionCard';
import { TutoringSession, SearchParams } from '../types/types';

const ITEMS_PER_PAGE = 10;

export const SearchPage: React.FC = () => {
  const [allSessions, setAllSessions] = useState<TutoringSession[]>([]);
  const [displayedSessions, setDisplayedSessions] = useState<TutoringSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState<SearchParams | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  const handleSearch = async (query: string, subject?: string, availability?: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentSearch({ searchText: query, subject, availability });
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, subject, availability }),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      setAllSessions(data.results);
      setDisplayedSessions(data.results.slice(0, ITEMS_PER_PAGE));
      setTotalResults(data.total);
      setFilteredCount(data.filtered_count || 0);
    } catch (err) {
      setError('Failed to fetch tutoring sessions. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const currentlyDisplayed = displayedSessions.length;
    const nextBatch = allSessions.slice(currentlyDisplayed, currentlyDisplayed + ITEMS_PER_PAGE);
    setDisplayedSessions([...displayedSessions, ...nextBatch]);
  };

  const canLoadMore = displayedSessions.length < allSessions.length;

  return (
    <div className="bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Perfect Tutor</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Connect with qualified tutors for personalized academic support across subjects.
          </p>
        </div>
        
        <SearchForm onSearch={handleSearch} isLoading={isLoading} resultCount={totalResults} />
        
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center mt-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="mt-10">
            {displayedSessions.length > 0 ? (
              <div className="space-y-6">
                {totalResults > 0 && (
                  <div className="bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-500/30">
                    <p className="text-lg font-medium text-emerald-400">
                      Found {totalResults} Tutoring {totalResults === 1 ? 'Session' : 'Sessions'}
                      {filteredCount > 0 && ` (${filteredCount} filtered based on your criteria)`}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-6">
                  {displayedSessions.map((session) => (
                    <TutoringSessionCard key={session.session_id} session={session} />
                  ))}
                </div>
                
                {canLoadMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-3 bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg shadow-lg hover:bg-slate-700 transition-colors duration-200"
                    >
                      Load More Results
                    </button>
                  </div>
                )}
              </div>
            ) : !isLoading && !error && (
              <div className="mt-12 text-center p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
                <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">No Sessions Found</h3>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  Try adjusting your search criteria or try a different search term
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 