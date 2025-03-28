"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getOrCreateProfile } from "@/lib/supabase" 

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback handler running")

        // Get tokens from URL if this is a callback from email verification
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const errorDescription = hashParams.get('error_description')
        
        console.log("URL hash params:", { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          errorDescription
        })
        
        // If there's an error in the URL, display it
        if (errorDescription) {
          setError(errorDescription)
          setIsProcessing(false)
          return
        }

        // Try multiple ways to ensure we have a session
        let sessionUser = null

        // 1. Check if we already have a session directly
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession?.user) {
          console.log("Found existing session", { user: existingSession.user.email })
          sessionUser = existingSession.user
        }

        // 2. If we have tokens in the URL, set them in the session
        if (!sessionUser && accessToken && refreshToken) {
          console.log("Setting session with tokens from URL")
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error("Error setting session:", error)
            throw error
          }
          
          console.log("Session set successfully from URL tokens")
          
          if (data?.session?.user) {
            sessionUser = data.session.user
          }
        }

        // 3. If we still don't have a session, try refreshing
        if (!sessionUser) {
          console.log("No user found, trying session refresh")
          const { data: refreshData } = await supabase.auth.refreshSession()
          
          if (refreshData?.session?.user) {
            console.log("Found user after refresh", { user: refreshData.session.user.email })
            sessionUser = refreshData.session.user
          }
        }
          
        // Create or update the user's profile if we have a user
        if (sessionUser) {
          try {
            console.log("Creating/updating profile for user:", sessionUser.id)
            await getOrCreateProfile(sessionUser.id, sessionUser.email || '')
          } catch (profileErr) {
            console.error("Profile error:", profileErr)
            // Continue anyway, this shouldn't block login
          }
          
          // Set cookies manually to ensure they exist
          if (accessToken && refreshToken) {
            console.log("Setting cookies manually")
            document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax`
            document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=7776000; SameSite=Lax`
          }
          
          // Wait briefly to ensure all state is updated
          await new Promise(r => setTimeout(r, 500))
          
          // Redirect to dashboard
          console.log("Authentication successful, redirecting to dashboard")
          router.push('/dashboard')
          return
        }
        
        // If we still don't have a session, redirect to sign in
        console.log("No session could be established, redirecting to signin")
        router.push('/signin')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Authentication failed. Please try signing in again.')
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-[#141414] p-6 rounded-xl border border-[#232323]">
          <h2 className="text-xl font-medium text-red-400 mb-2">Authentication Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-white mb-2">Completing sign in...</h2>
        <p className="text-[#666]">Please wait while we redirect you.</p>
      </div>
    </div>
  )
} 