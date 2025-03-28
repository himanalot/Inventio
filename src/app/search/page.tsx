"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, Star, Clock, MapPin, ChevronRight } from 'lucide-react'
import { RiGraduationCapFill } from "react-icons/ri"

// Import the same mock data we used on the home page
const MOCK_TUTORS = [
  {
    id: "t1",
    name: "Alicia Zhang",
    subject: "Calculus, Linear Algebra",
    rating: 4.9,
    reviews: 42,
    hourlyRate: 25,
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    education: "Stanford University",
    availability: ["Weekdays", "Evenings"],
    description: "I'm a Math PhD candidate with 4+ years of tutoring experience. I specialize in calculus, linear algebra, and differential equations."
  },
  {
    id: "t2",
    name: "Marcus Johnson",
    subject: "Physics, Chemistry",
    rating: 4.8,
    reviews: 38,
    hourlyRate: 30,
    image: "https://randomuser.me/api/portraits/men/54.jpg",
    education: "MIT",
    availability: ["Weekends", "Evenings"],
    description: "Physics major with a minor in Chemistry. I can help with introductory physics courses, mechanics, thermodynamics, and general chemistry."
  },
  {
    id: "t3",
    name: "Sophia Martinez",
    subject: "Computer Science, Data Structures",
    rating: 5.0,
    reviews: 27,
    hourlyRate: 35,
    image: "https://randomuser.me/api/portraits/women/67.jpg",
    education: "UC Berkeley",
    availability: ["Weekdays", "Weekends", "Flexible"],
    description: "Software engineer with a CS degree. I teach programming fundamentals, data structures, algorithms, and web development."
  },
  {
    id: "t4",
    name: "David Kim",
    subject: "Organic Chemistry, Biochemistry",
    rating: 4.7,
    reviews: 53,
    hourlyRate: 28,
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    education: "UCLA",
    availability: ["Mornings", "Afternoons"],
    description: "Pre-med student who has aced all my chemistry courses. I can simplify complex organic chemistry concepts and help with lab preparations."
  },
  {
    id: "t5",
    name: "Emily Rodriguez",
    subject: "Economics, Statistics",
    rating: 4.9,
    reviews: 31,
    hourlyRate: 32,
    image: "https://randomuser.me/api/portraits/women/45.jpg",
    education: "NYU",
    availability: ["Evenings", "Weekends"],
    description: "Economics major with a focus on quantitative methods. I can help with micro/macroeconomics, econometrics, and statistical analysis."
  },
  {
    id: "t6",
    name: "Jordan Lee",
    subject: "English Literature, Writing",
    rating: 4.8,
    reviews: 45,
    hourlyRate: 26,
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    education: "Columbia University",
    availability: ["Weekdays", "Flexible"],
    description: "English major and published writer. I help with essay writing, literary analysis, research papers, and English composition classes."
  },
  {
    id: "t7",
    name: "Taylor Wilson",
    subject: "Biology, Anatomy",
    rating: 4.9,
    reviews: 36,
    hourlyRate: 29,
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    education: "Johns Hopkins",
    availability: ["Weekdays", "Weekends"],
    description: "Biology student on the pre-med track. I excel at explaining complex biological systems, anatomy, physiology, and cellular biology."
  },
  {
    id: "t8",
    name: "Alex Patel",
    subject: "Computer Science, Python",
    rating: 4.7,
    reviews: 41,
    hourlyRate: 34,
    image: "https://randomuser.me/api/portraits/men/67.jpg",
    education: "Georgia Tech",
    availability: ["Evenings", "Weekends"],
    description: "Computer Science senior specializing in Python programming. I can help with coding assignments, algorithms, and data science projects."
  }
];

// Extract unique subjects for the dropdown
const ALL_SUBJECTS = Array.from(
  new Set(
    MOCK_TUTORS.flatMap(tutor => 
      tutor.subject.split(', ').map(s => s.trim())
    )
  )
).sort();

// Extract unique availability options for the dropdown
const ALL_AVAILABILITY = Array.from(
  new Set(
    MOCK_TUTORS.flatMap(tutor => tutor.availability)
  )
).sort();

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get('query') || ''
  
  const [searchQuery, setSearchQuery] = useState(queryFromUrl)
  const [results, setResults] = useState<typeof MOCK_TUTORS>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filteredResults, setFilteredResults] = useState<typeof MOCK_TUTORS>([])
  const [subject, setSubject] = useState<string>('')
  const [availability, setAvailability] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('rating')
  
  // Get initial results from the URL query parameter
  useEffect(() => {
    if (queryFromUrl) {
      searchTutors(queryFromUrl)
    } else {
      // Show all tutors if no query
      setResults(MOCK_TUTORS)
      setFilteredResults(sortTutors(MOCK_TUTORS, sortBy))
    }
  }, [queryFromUrl, sortBy])
  
  // Handle the search action
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchTutors(searchQuery)
    
    // Update URL with search query for shareable links
    const params = new URLSearchParams(window.location.search)
    if (searchQuery) {
      params.set('query', searchQuery)
    } else {
      params.delete('query')
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl)
  }
  
  // Sort tutors based on selected sort option
  const sortTutors = (tutors: typeof MOCK_TUTORS, sortOption: string) => {
    return [...tutors].sort((a, b) => {
      switch (sortOption) {
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.hourlyRate - b.hourlyRate;
        case 'price_high':
          return b.hourlyRate - a.hourlyRate;
        case 'reviews':
          return b.reviews - a.reviews;
        default:
          return b.rating - a.rating;
      }
    });
  }
  
  // Mock search function
  const searchTutors = (query: string) => {
    setIsLoading(true)
    
    setTimeout(() => {
      // Filter tutors based on the search query
      const filtered = MOCK_TUTORS.filter(tutor => 
        tutor.name.toLowerCase().includes(query.toLowerCase()) ||
        tutor.subject.toLowerCase().includes(query.toLowerCase()) ||
        tutor.description.toLowerCase().includes(query.toLowerCase())
      )
      
      setResults(filtered)
      setFilteredResults(sortTutors(filtered, sortBy))
      setIsLoading(false)
    }, 800)
  }
  
  // Apply additional filters
  useEffect(() => {
    let filtered = [...results]
    
    if (subject) {
      filtered = filtered.filter(tutor => 
        tutor.subject.toLowerCase().includes(subject.toLowerCase())
      )
    }
    
    if (availability) {
      filtered = filtered.filter(tutor => 
        tutor.availability.some(a => a.toLowerCase() === availability.toLowerCase())
      )
    }
    
    setFilteredResults(sortTutors(filtered, sortBy))
  }, [subject, availability, results, sortBy])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                  <RiGraduationCapFill className="h-5 w-5" />
                </div>
                <span className="text-white font-bold text-xl">Mentori</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/search" className="text-emerald-400 hover:text-emerald-300 px-3 py-2 text-sm font-medium">
                Find Tutors
              </Link>
              <Link href="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Search section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Perfect Tutor</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Connect with qualified peer tutors who've aced the exact same courses you're taking now.
          </p>
        </div>
        
        {/* Search form */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by subject, course, or tutor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-6 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 focus:ring-opacity-50 rounded-xl transition-all duration-200"
                />
              </div>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 rounded-xl shadow-lg shadow-emerald-900/20"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Searching...</span>
                  </div>
                ) : "Search Tutors"}
              </Button>
            </div>
            
            {/* Optional filters */}
            <div className="pt-4 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm text-slate-400 whitespace-nowrap">Subject:</label>
                <select 
                  className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 text-sm flex-1"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {ALL_SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-slate-400 whitespace-nowrap">Availability:</label>
                <select 
                  className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 text-sm flex-1"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="">Any Time</option>
                  {ALL_AVAILABILITY.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-slate-400 whitespace-nowrap">Sort By:</label>
                <select
                  className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2 text-sm flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Top Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        
        {/* Results section */}
        <div className="space-y-6">
          {/* Results count */}
          <div className="bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-500/30">
            <p className="text-lg font-medium text-emerald-400">
              {isLoading ? 'Searching for tutors...' : (
                filteredResults.length > 0 
                  ? `Found ${filteredResults.length} tutors${searchQuery ? ` for "${searchQuery}"` : ''}`
                  : 'No tutors found matching your criteria'
              )}
            </p>
          </div>
          
          {/* Applied filters display */}
          {(subject || availability) && !isLoading && (
            <div className="flex flex-wrap gap-2 mb-4">
              {subject && (
                <div className="bg-slate-800 py-1 px-3 rounded-full flex items-center text-sm">
                  <span className="text-emerald-400 mr-2">Subject:</span>
                  <span className="text-white">{subject}</span>
                  <button 
                    className="ml-2 text-slate-400 hover:text-white"
                    onClick={() => setSubject('')}
                  >
                    ×
                  </button>
                </div>
              )}
              {availability && (
                <div className="bg-slate-800 py-1 px-3 rounded-full flex items-center text-sm">
                  <span className="text-emerald-400 mr-2">Availability:</span>
                  <span className="text-white">{availability}</span>
                  <button 
                    className="ml-2 text-slate-400 hover:text-white"
                    onClick={() => setAvailability('')}
                  >
                    ×
                  </button>
                </div>
              )}
              {(subject || availability) && (
                <button
                  className="text-sm text-emerald-400 hover:text-emerald-300 underline"
                  onClick={() => {
                    setSubject('');
                    setAvailability('');
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
          
          {/* Tutor cards */}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-6">
              {filteredResults.map(tutor => (
                <div key={tutor.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Tutor image and basic info */}
                      <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48">
                        <img 
                          src={tutor.image} 
                          alt={tutor.name} 
                          className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-700"
                        />
                        <div className="md:mt-4 flex flex-col">
                          <div className="flex items-center mb-1">
                            <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
                            <span className="text-white font-medium">{tutor.rating}</span>
                            <span className="text-slate-400 text-sm ml-1">({tutor.reviews})</span>
                          </div>
                          <p className="text-emerald-400 font-semibold">${tutor.hourlyRate}/hr</p>
                        </div>
                      </div>
                      
                      {/* Main tutor details */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{tutor.name}</h3>
                          <div className="text-slate-400 text-sm flex items-center mt-1 md:mt-0">
                            <MapPin className="h-4 w-4 mr-1" />
                            {tutor.education}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-emerald-400 font-medium mb-1">Subjects</h4>
                          <div className="flex flex-wrap gap-2">
                            {tutor.subject.split(', ').map(subj => (
                              <span 
                                key={subj} 
                                className="bg-slate-700 hover:bg-slate-600 cursor-pointer px-3 py-1 rounded-full text-sm text-white"
                                onClick={() => setSubject(subj)}
                              >
                                {subj}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-emerald-400 font-medium mb-1">About</h4>
                          <p className="text-slate-300">{tutor.description}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-between">
                          <div>
                            <h4 className="text-emerald-400 font-medium mb-1">Availability</h4>
                            <div className="flex flex-wrap gap-2">
                              {tutor.availability.map(time => (
                                <div 
                                  key={time} 
                                  className="bg-slate-700 hover:bg-slate-600 cursor-pointer px-3 py-1 rounded-full text-xs text-white flex items-center"
                                  onClick={() => setAvailability(time)}
                                >
                                  <Clock className="h-3 w-3 mr-1" /> {time}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="border-slate-700 hover:border-emerald-500 text-white hover:bg-slate-700"
                            >
                              Message
                              <MessageSquare className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            >
                              Book Session
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center my-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent"></div>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && filteredResults.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No tutors found</h3>
              <p className="text-slate-400 mb-6">Try adjusting your search criteria or browse all tutors</p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSubject('')
                  setAvailability('')
                  setResults(MOCK_TUTORS)
                  setFilteredResults(sortTutors(MOCK_TUTORS, sortBy))
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                View All Tutors
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="text-white text-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading search results...</p>
      </div>
    </div>}>
      <SearchPageContent />
    </Suspense>
  )
} 