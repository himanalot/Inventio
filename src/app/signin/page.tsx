"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RiGraduationCapFill } from "react-icons/ri"
import { FaGithub } from "react-icons/fa"
import { signIn } from "@/lib/supabase"
import { useAuth } from "@/components/providers/AuthProvider"
import { useToast } from "@/components/ui/use-toast"

export default function SignInPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log("User already logged in, redirecting to dashboard")
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log("Attempting sign in with email:", email)
      
      // Try signing in with email/password
      const { data, error: signInError } = await signIn(email, password)
      
      if (signInError) {
        console.error("Sign in error:", signInError)
        throw signInError
      }
      
      if (data.session) {
        toast({
          title: "Sign in successful",
          description: "Welcome back!",
        })
        
        console.log("Redirecting to dashboard...")
        router.push("/dashboard")
      } else {
        throw new Error("Sign in failed - no session returned")
      }
    } catch (err: any) {
      console.error("Sign in process error:", err)
      setError(err.message || "Failed to sign in. Please check your credentials.")
      toast({
        title: "Sign in failed",
        description: err.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#666]">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render the sign-in form if we're already authenticated
  if (user) {
    return null // We'll redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#141414] rounded-xl shadow-xl border border-[#232323] overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-6">
            <div className="flex justify-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white">
                <RiGraduationCapFill className="h-7 w-7" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mt-4">Sign in to Mentori</h1>
            <p className="text-[#666] mt-2">Connect with peer tutors and academic resources</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#141414] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-center">
                <span className="bg-[#333] h-px flex-grow" />
                <span className="px-4 text-[#666] text-sm">OR</span>
                <span className="bg-[#333] h-px flex-grow" />
              </div>
              
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-[#141414] font-medium py-2 px-4 rounded-lg shadow"
                onClick={() => router.push('/debug')}
              >
                <FaGithub className="h-5 w-5" />
                Debug Authentication
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[#666]">
              Don't have an account?{" "}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300">
                Sign up
              </Link>
            </p>
          </div>
          
          {/* Debug helper for authentication issues */}
          <div className="mt-6 text-center">
            <p className="text-[#666] text-xs">
              Having trouble signing in?{" "}
              <Link href="/debug" className="text-emerald-400 hover:text-emerald-300">
                Try our debugging tool
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 