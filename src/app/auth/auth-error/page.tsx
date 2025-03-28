"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export default function AuthError() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-ink-100 text-center"
      >
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <span className="font-bold text-3xl text-ink-700">
              inkr<span className="text-accent-500">.</span>
            </span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-4 text-ink-900">Authentication Error</h1>
        <p className="text-ink-600 mb-8">
          There was a problem with the authentication process. This could be because the link has expired or is invalid.
        </p>

        <div className="space-y-4">
          <Button 
            asChild
            className="w-full bg-gradient-to-r from-ink-600 to-ink-700 hover:from-ink-700 hover:to-ink-800"
          >
            <Link href="/signin">
              Try signing in again
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            className="w-full border-2 hover:bg-ink-50"
          >
            <Link href="/">
              Return to home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
} 