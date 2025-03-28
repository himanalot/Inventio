"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchFormProps {
  onSearch: (query: string, subject?: string, availability?: string) => void;
  isLoading: boolean;
  resultCount: number;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, resultCount }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [subject, setSubject] = useState("any");
  const [availability, setAvailability] = useState("any");
  const [isRandom, setIsRandom] = useState(false);

  // Common subjects for tutoring
  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "English",
    "History",
    "Economics",
    "Psychology",
    "Sociology",
    "Foreign Languages",
    "Engineering"
  ];
  
  // Availability options
  const availabilityOptions = [
    "Weekdays",
    "Weekends",
    "Evenings",
    "Mornings",
    "Afternoons",
    "Flexible"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(
      searchQuery, 
      subject === "any" ? "" : subject, 
      availability === "any" ? "" : availability
    );
  };

  const handleRandomSearch = () => {
    setIsRandom(true);
    onSearch("", "", "");
  };

  useEffect(() => {
    // Reset the random state after search is done
    if (!isLoading && isRandom) {
      setIsRandom(false);
    }
  }, [isLoading, isRandom]);

  return (
    <div className="w-full space-y-4 bg-slate-900 rounded-2xl p-6 shadow-xl">
      {/* Status Messages */}
      <AnimatePresence>
        {isLoading && (
          <div className="mb-4">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-emerald-400 font-medium"
            >
              <motion.p>
                {isRandom ? (
                  'Finding a perfect match for you...'
                ) : (
                  'Searching for tutors...'
                )}
              </motion.p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Search query input */}
            <div className="md:col-span-12">
              <label htmlFor="search-query" className="block text-sm font-medium text-white mb-2">
                Search for tutors or sessions
              </label>
              <div className="relative">
                <Input
                  id="search-query"
                  type="text"
                  placeholder="e.g., calculus, essay writing, python programming"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 py-3 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 focus:ring-opacity-50 rounded-xl transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filters row */}
            <div className="md:col-span-5">
              <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                Subject
              </label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white py-3 rounded-xl focus:ring focus:ring-emerald-500/20 focus:border-emerald-500">
                  <SelectValue placeholder="Any subject" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white rounded-xl shadow-lg">
                  <SelectItem value="any" className="focus:bg-slate-700 focus:text-white">Any subject</SelectItem>
                  {subjects.map((subj) => (
                    <SelectItem key={subj} value={subj} className="focus:bg-slate-700 focus:text-white">{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability filter */}
            <div className="md:col-span-5">
              <label htmlFor="availability" className="block text-sm font-medium text-white mb-2">
                Availability
              </label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white py-3 rounded-xl focus:ring focus:ring-emerald-500/20 focus:border-emerald-500">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white rounded-xl shadow-lg">
                  <SelectItem value="any" className="focus:bg-slate-700 focus:text-white">Any time</SelectItem>
                  {availabilityOptions.map((time) => (
                    <SelectItem key={time} value={time} className="focus:bg-slate-700 focus:text-white">{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search button */}
            <div className="md:col-span-2 flex items-end">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching
                  </>
                ) : "Search"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
          <div className="flex space-x-4 text-sm">
            <Button 
              type="button" 
              variant="ghost" 
              className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-all duration-200"
              onClick={handleRandomSearch}
              disabled={isLoading || isRandom}
            >
              {isRandom ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding match...
                </>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  I'm feeling lucky
                </div>
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              className="text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all duration-200"
              onClick={() => {
                setSearchQuery("");
                setSubject("any");
                setAvailability("any");
              }}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </Button>
          </div>
          {resultCount > 0 && !isLoading && (
            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-500/30">
              {resultCount} {resultCount === 1 ? 'tutor' : 'tutors'} found
            </div>
          )}
        </div>
      </form>
    </div>
  );
} 