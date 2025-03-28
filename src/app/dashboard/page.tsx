"use client"

import { Button } from "@/components/ui/button"
import { supabase, refreshSession } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SearchForm } from "../search/SearchForm"
import { TutoringSessionCard } from "../search/TutoringSessionCard"
import { TutoringSession } from "../types/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { RiGraduationCapFill } from "react-icons/ri"
import { SessionFixer } from '@/components/SessionFixer'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [searchResults, setSearchResults] = useState<TutoringSession[]>([])
  const [resultCount, setResultCount] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [noResultsMessage, setNoResultsMessage] = useState<{message: string, suggestions: string[]} | null>(null)
  const [savedSessions, setSavedSessions] = useState<Set<string>>(new Set())
  const resultsPerPage = 10
  const [error, setError] = useState<string | null>(null)

  // Add safety timeout to prevent getting stuck forever
  const authTimeoutId = setTimeout(() => {
    setSessionChecked(true)
    setLoading(false)
    setError("Authentication check timed out. Please try signing in again.")
  }, 8000)

  // Define function to check auth and fetch user data
  const checkAuthAndFetchSessions = async () => {
    setLoading(true)
    
    try {
      // First just try to get the current session directly
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        clearTimeout(authTimeoutId) // Clear timeout
        setUser(currentSession.user)
        setSessionChecked(true)
        setLoading(false)
        return
      }
      
      // Fall back to standard flow - attempt to refresh the session
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
      
      if (refreshedSession) {
        setUser(refreshedSession.user)
        setSessionChecked(true)
        setLoading(false)
        return
      }
      
      // If refresh failed and we're in a browser context, try our session repair API
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/fix-auth')
          const data = await response.json()
          
          if (data.fixed && data.session) {
            // Check session again after repair
            const { data: { session: repairedSession } } = await supabase.auth.getSession()
            
            if (repairedSession) {
              setUser(repairedSession.user)
              setSessionChecked(true)
              setLoading(false)
              return
            }
          }
        } catch (apiError) {
          // Continue if API repair fails
        }
      }
      
      // No session could be established
      setSessionChecked(true)
      setLoading(false)
      router.push('/signin')
    } catch (error) {
      clearTimeout(authTimeoutId) // Clear timeout
      setError("Authentication error. Please try signing in again.")
      setSessionChecked(true)
      setLoading(false)
    }
  }

  // Check authentication immediately on component mount
  useEffect(() => {
    let mounted = true
    
    // Only run checks if component is mounted
    if (mounted) {
      checkAuthAndFetchSessions()
    }
    
    // Clean up function
    return () => {
      mounted = false
      clearTimeout(authTimeoutId)
    }
  }, [router])

  const handleSignOut = async () => {
    try {
      setLoading(true)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear cookies manually to ensure they're removed
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      
      // Clear localStorage items
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('supabase-auth')
        window.localStorage.removeItem('supabase.auth.token')
      }
      
      // Navigate to sign-in page
      router.push('/signin')
    } catch (error) {
      setError('Error signing out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-white mb-2">Loading your dashboard...</h2>
          <p className="text-[#666]">Please wait while we prepare your experience.</p>
        </div>
      </div>
    )
  }

  // Pagination component
  const PaginationControls = () => {
    const totalPages = Math.ceil(searchResults.length / resultsPerPage)
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={cn(
                currentPage === page 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              )}
            >
              {page}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          Next
        </Button>
      </div>
    )
  }

  // Get current page results
  const getCurrentPageResults = () => {
    const startIndex = (currentPage - 1) * resultsPerPage
    return searchResults.slice(startIndex, startIndex + resultsPerPage)
  }
  
  // Handle search function
  const handleSearch = async (query: string, subject?: string, availability?: string) => {
    setLoading(true)
    setError(null)
    setNoResultsMessage(null)
    
    try {
      // In a real app, you would search the database
      // For now, we'll simulate a search with a delay
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, subject, availability }),
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      if (data.results.length === 0) {
        setNoResultsMessage({
          message: `No tutoring sessions found for "${query}"`,
          suggestions: [
            "Try different keywords or a broader search term",
            "Check for typos in your search",
            "Browse all available sessions by subject",
            "Try searching without filters"
          ]
        })
      }
      
      setSearchResults(data.results)
      setResultCount(data.total || data.results.length)
      setCurrentPage(1) // Reset to first page on new search
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to retrieve tutoring sessions. Please try again later.')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle saving sessions
  const handleSaveToggle = async () => {
    // This is a placeholder for the save session functionality
    // In a real app, you would save to the database
    alert('Session save/unsave feature will be implemented soon!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
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
              <Link href="/schedule" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Schedule
              </Link>
              <Link href="/search" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Find Tutors
              </Link>
              <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:text-white"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Auth debugging component */}
        {error && <SessionFixer />}
        
        {/* User welcome section */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Welcome to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Dashboard</span>
          </h1>
          <p className="text-slate-400 max-w-3xl text-lg">
            Manage your tutoring schedule, track progress, and find new learning opportunities.
          </p>
        </div>
        
        {/* User overview */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white text-lg">Profile Completion</h3>
                <div className="flex items-center mt-2">
                  <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="ml-2 text-sm text-emerald-400">65%</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">Complete your profile to improve matches</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white text-lg">Upcoming Sessions</h3>
                <p className="text-2xl font-bold text-white mt-1">2</p>
                <p className="text-sm text-slate-400">Next: Physics Tutoring, Tomorrow 3:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white text-lg">Total Sessions</h3>
                <p className="text-2xl font-bold text-white mt-1">8</p>
                <p className="text-sm text-slate-400">12 hours of tutoring completed</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-colors">
            <h3 className="text-xl font-medium text-white mb-3">Complete Your Profile</h3>
            <p className="text-slate-400 mb-4">Add your subjects, learning goals, and schedule preferences to get better tutor matches.</p>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
              Update Profile
            </Button>
          </div>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-colors">
            <h3 className="text-xl font-medium text-white mb-3">Manage Schedule</h3>
            <p className="text-slate-400 mb-4">View your upcoming sessions, reschedule or cancel if needed, and add new availability.</p>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
              View Schedule
            </Button>
          </div>
        </div>
        
        {/* Search section */}
        <div className="mb-12">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Find Tutors</h2>
            <SearchForm 
              onSearch={handleSearch} 
              isLoading={loading} 
              resultCount={resultCount} 
            />
            
            {/* Error message */}
            {error && (
              <div className="mt-6 bg-red-900/30 border border-red-500/40 text-red-400 p-4 rounded-lg">
                <p className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
            
            {/* No results message */}
            {noResultsMessage && !loading && (
              <div className="mt-6 bg-slate-700/50 border border-slate-600 p-6 rounded-xl text-center">
                <svg className="h-12 w-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">{noResultsMessage.message}</h3>
                <ul className="text-slate-400 mt-4 space-y-2 max-w-lg mx-auto text-sm">
                  {noResultsMessage.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-emerald-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Results section (when available) */}
        {searchResults.length > 0 && !loading && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Search Results</h2>
            
            {getCurrentPageResults().map((session) => (
              <TutoringSessionCard 
                key={session.session_id} 
                session={session}
                showSaveButton={true}
                onSaveToggle={handleSaveToggle}
                isSaved={savedSessions.has(session.session_id)}
              />
            ))}
            
            {/* Pagination */}
            <PaginationControls />
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  )
} 
