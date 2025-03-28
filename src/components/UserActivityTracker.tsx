'use client'

import { useEffect } from 'react'
import { recordUserActivity } from '@/lib/analytics'

export function UserActivityTracker() {
  useEffect(() => {
    recordUserActivity()
    
    // Record activity when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordUserActivity()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  return null
} 