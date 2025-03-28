"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ResearchProject } from "../types/types"
import { ResearchOpportunity } from "../search/ResearchOpportunity"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SavedOpportunities() {
  const router = useRouter()
  const [savedProjects, setSavedProjects] = useState<ResearchProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSavedOpportunities = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('saved_opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })

      if (error) throw error

      setSavedProjects(data.map(item => item.project_data))
    } catch (err) {
      console.error('Error fetching saved opportunities:', err)
      setError('Failed to load saved opportunities')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedOpportunities()
  }, [])

  const handleUnsave = () => {
    fetchSavedOpportunities() // Refresh the list after unsaving
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <nav className="fixed top-0 w-full border-b border-ink-100 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-2xl text-ink-700">
            inkr<span className="text-accent-500">.</span>
          </span>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="border-2 hover:bg-ink-50"
          >
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-ink-900">
              Saved Opportunities
            </h1>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-ink-600">Loading saved opportunities...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : savedProjects.length === 0 ? (
            <div className="text-center bg-white rounded-xl shadow-lg shadow-ink-100/20 border border-ink-100/40 p-8">
              <div className="w-16 h-16 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-ink-900 mb-3">No saved opportunities yet</h3>
              <p className="text-ink-600 mb-6 max-w-md mx-auto">
                Save research opportunities that interest you to keep track of them and easily reach out to principal investigators later.
              </p>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-accent-500 hover:bg-accent-600 text-white font-medium shadow-lg shadow-accent-200/20"
              >
                Find Opportunities
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {savedProjects.map((project) => (
                <ResearchOpportunity 
                  key={project.appl_id} 
                  project={project}
                  isSaved={true}
                  onSaveToggle={handleUnsave}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 