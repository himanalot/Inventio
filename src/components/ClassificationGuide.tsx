'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { ScrollArea } from "@/components/ui/scroll-area"

export function ClassificationGuide() {
  const [showAutoGuide, setShowAutoGuide] = useState(false)
  const [showManualGuide, setShowManualGuide] = useState(false)

  useEffect(() => {
    const checkGuideStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('has_seen_classification_guide')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching guide status:', error)
          return
        }

        // If they haven't seen it and we're on dashboard, show it
        if (!data?.has_seen_classification_guide && window.location.pathname === '/dashboard') {
          setShowAutoGuide(true)
          
          // Mark as seen
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ has_seen_classification_guide: true })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error updating guide status:', updateError)
          }
        }
      } catch (error) {
        console.error('Error in checkGuideStatus:', error)
      }
    }

    // Wait a bit before checking to ensure smooth loading
    const timer = setTimeout(checkGuideStatus, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Button-triggered dialog */}
      <Dialog open={showManualGuide} onOpenChange={setShowManualGuide}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 border-ink-200 hover:bg-ink-50"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Search Tips
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[min(calc(100%-2rem),28rem)] sm:w-[28rem] p-4 sm:p-6 rounded-lg sm:rounded-xl border border-ink-200 shadow-lg">
          <GuideContent />
        </DialogContent>
      </Dialog>

      {/* Auto-popup dialog */}
      <Dialog open={showAutoGuide} onOpenChange={setShowAutoGuide}>
        <DialogContent className="w-[min(calc(100%-2rem),28rem)] sm:w-[28rem] p-4 sm:p-6 rounded-lg sm:rounded-xl border border-ink-200 shadow-lg">
          <GuideContent />
        </DialogContent>
      </Dialog>
    </>
  )
}

function GuideContent() {
  return (
    <>
      <DialogHeader className="space-y-2 pb-3 sm:pb-4">
        <DialogTitle className="text-lg sm:text-xl font-semibold">Quick Search Guide</DialogTitle>
        <DialogDescription className="text-sm text-ink-600">
          Learn how to find the most relevant research opportunities
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100vh-12rem)]">
        <div className="space-y-4">
          {/* Example Search */}
          <div>
            <div className="text-sm font-medium text-ink-700 mb-2">Example Search</div>
            <div className="font-mono text-xs sm:text-sm bg-ink-900 text-ink-50 rounded-lg p-3 border border-ink-800 overflow-x-auto whitespace-nowrap">
              machine learning cancer research Stanford
            </div>
          </div>

          {/* Tips */}
          <div className="bg-accent-50 rounded-lg border border-accent-100 p-3">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-accent-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-accent-900">Include in your search:</span>
                <ul className="mt-2 space-y-1.5 text-sm text-accent-700">
                  <li className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Research topic or field
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    University or location
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Specific techniques or methods
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-orange-50 rounded-lg border border-orange-100 p-3">
            <div className="flex gap-2.5">
              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="space-y-2">
                <p className="text-sm text-orange-800">
                  Some results might include equipment or training grants. We're actively working to improve our filters.
                </p>
                <p className="text-sm text-orange-800">
                  For now, focus on opportunities that mention research projects and lab positions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  )
} 