"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { RiGraduationCapFill } from "react-icons/ri"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function NavBar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="border-b border-[#232323] bg-[#141414]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              <RiGraduationCapFill className="h-5 w-5" />
            </div>
            <span className="text-white font-bold text-xl">Mentori</span>
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <Link href="/schedule" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Schedule
              </Link>
              <Link href="/search" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Find Tutors
              </Link>
              <Link href="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/library" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Library
              </Link>
              <Link href="/pdf" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Upload PDF
              </Link>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-[#232323]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/signin" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium">
                Sign In
              </Link>
              <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 