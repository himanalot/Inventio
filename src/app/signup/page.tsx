"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RiGraduationCapFill } from "react-icons/ri"
import { supabase, getOrCreateProfile } from "@/lib/supabase"
import { AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Clean email input
      const cleanEmail = email.trim().toLowerCase()
      
      // Basic validation
      if (!cleanEmail || !password) {
        throw new Error("Please provide both email and password")
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        
        // Handle common signup errors
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Try signing in instead.')
        }
        
        throw new Error(signUpError.message || "Failed to create account. Please try again.")
      }

      if (!data.user) {
        throw new Error("Failed to create account. Please try again.")
      }

      // Create a profile for the user
      if (data.user) {
        await getOrCreateProfile(data.user.id, data.user.email || cleanEmail)
      }

      // Check if confirmation is required
      if (!data.session) {
        setSuccess(true)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Sign up error:', err)
      setError(err.message || "An error occurred during sign up")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 mb-6">
            We've sent you a confirmation link to {email}.<br />
            Please check your email to complete your registration.
          </p>
          <Button
            onClick={() => router.push('/signin')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-[#232323] bg-[#141414]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                <RiGraduationCapFill className="h-5 w-5" />
              </div>
              <span className="text-white font-bold text-xl">Mentori</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Sign Up Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Create your account</h2>
            <p className="mt-2 text-sm text-[#666]">
              Already have an account?{" "}
              <Link href="/signin" className="text-emerald-400 hover:text-emerald-300">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141414] border-[#232323] text-white placeholder-[#666] focus:border-emerald-500 focus:ring-emerald-500/20"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141414] border-[#232323] text-white placeholder-[#666] focus:border-emerald-500 focus:ring-emerald-500/20"
                placeholder="Create a password (8+ characters)"
                minLength={8}
              />
            </div>

            <div className="text-sm text-[#666]">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-emerald-400 hover:text-emerald-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
                Privacy Policy
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Creating account...</span>
                </div>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 