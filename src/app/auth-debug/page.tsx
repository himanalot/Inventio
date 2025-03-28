"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { NavBar } from '@/components/NavBar'
import { Button } from '@/components/ui/button'

export default function AuthDebugPage() {
  const { user, isLoading, refreshAuth, signOut } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    async function checkAuth() {
      addLog('Checking session...')
      const { data, error } = await supabase.auth.getSession()
      setSessionData(data)
      
      if (error) {
        addLog(`Session error: ${error.message}`)
      } else if (data.session) {
        addLog(`Found session for user: ${data.session.user.email}`)
        addLog(`Session expires at: ${new Date(data.session.expires_at! * 1000).toLocaleString()}`)
        
        // Check for cookies
        checkCookies()
      } else {
        addLog('No active session found')
      }
    }
    
    checkAuth()
  }, [])
  
  function addLog(message: string) {
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }
  
  function checkCookies() {
    const cookies = document.cookie
    addLog(`Cookies: ${cookies || 'None'}`)
    
    const hasAuthCookies = cookies.includes('sb-')
    addLog(`Auth cookies present: ${hasAuthCookies}`)
  }
  
  async function refreshSession() {
    addLog('Refreshing session...')
    await refreshAuth()
    addLog('Session refreshed')
    
    // Check session again
    const { data } = await supabase.auth.getSession()
    setSessionData(data)
    
    if (data.session) {
      addLog(`Refreshed session for user: ${data.session.user.email}`)
    } else {
      addLog('No session after refresh')
    }
  }
  
  async function handleSignOut() {
    addLog('Signing out...')
    await signOut()
    addLog('Signed out')
    setSessionData(null)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <NavBar />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-[#141414] rounded-lg border border-[#232323] p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Auth Status</h2>
              
              <div className="bg-[#1A1A1A] rounded p-4 mb-4">
                <p className="text-slate-400 mb-1">Loading: <span className="text-white">{isLoading ? 'Yes' : 'No'}</span></p>
                <p className="text-slate-400 mb-1">Authenticated: <span className="text-white">{user ? 'Yes' : 'No'}</span></p>
                {user && (
                  <>
                    <p className="text-slate-400 mb-1">User ID: <span className="text-white">{user.id}</span></p>
                    <p className="text-slate-400 mb-1">Email: <span className="text-white">{user.email}</span></p>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={refreshSession}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Refresh Session
                </Button>
                
                <Button
                  onClick={checkCookies}
                  variant="outline"
                  className="border-[#333] text-white hover:bg-[#232323]"
                >
                  Check Cookies
                </Button>
                
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Debug Log</h2>
              <div className="bg-[#1A1A1A] rounded p-4 h-80 overflow-y-auto text-sm font-mono">
                {debugInfo.map((log, index) => (
                  <div key={index} className="text-slate-400 mb-1">
                    {log}
                  </div>
                ))}
                {debugInfo.length === 0 && (
                  <p className="text-slate-500 italic">No logs yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#141414] rounded-lg border border-[#232323] p-6">
          <h2 className="text-xl font-semibold text-white mb-3">Session Data</h2>
          <pre className="bg-[#1A1A1A] rounded p-4 overflow-x-auto text-sm text-slate-400 h-64 overflow-y-auto">
            {JSON.stringify(sessionData, null, 2) || 'No session data'}
          </pre>
        </div>
      </div>
    </div>
  )
} 