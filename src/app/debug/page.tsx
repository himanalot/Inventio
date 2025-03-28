"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function DebugPage() {
  const [authData, setAuthData] = useState<null | any>(null)
  const [loading, setLoading] = useState(false)
  
  const checkAuth = async () => {
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setAuthData({
        hasSession: !!session,
        user: session?.user?.email || 'none',
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      })
    } catch (error) {
      setAuthData({
        error: 'Failed to check auth status',
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }
  
  const clearAuthData = async () => {
    if (confirm('This will clear all auth data and sign you out. Continue?')) {
      setLoading(true)
      
      try {
        // Sign out from Supabase
        await supabase.auth.signOut()
        
        // Clear cookies
        document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('supabase-auth')
        }
        
        setAuthData(null)
        alert('Auth data cleared. You are now signed out.')
      } catch (error) {
        alert('Error clearing auth data: ' + (error instanceof Error ? error.message : String(error)))
      } finally {
        setLoading(false)
      }
    }
  }
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
        
        <div className="mb-8 flex gap-4">
          <Button
            onClick={checkAuth}
            className="bg-slate-700 hover:bg-slate-600"
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Auth Status"}
          </Button>
          
          <Button
            onClick={clearAuthData}
            className="bg-red-700 hover:bg-red-600"
            disabled={loading}
          >
            Clear Auth Data
          </Button>
        </div>
        
        {authData && (
          <div className="bg-slate-800 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-medium mb-2">Auth Status</h2>
            <pre className="bg-slate-900 p-3 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(authData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">
              Home
            </Button>
          </Link>
          
          <Link href="/dashboard">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">
              Dashboard
            </Button>
          </Link>
          
          <Link href="/auth-debug">
            <Button className="w-full bg-slate-600 hover:bg-slate-700">
              Auth Debugger
            </Button>
          </Link>
          
          <Link href="/signin">
            <Button className="w-full bg-slate-600 hover:bg-slate-700">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 