"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function FundingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [organization, setOrganization] = useState("")
  const [message, setMessage] = useState("")
  const [isResearcher, setIsResearcher] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Get user if logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      // Create payload with or without user_id
      const payload = {
        name,
        email,
        organization,
        message,
        is_researcher: isResearcher,
        created_at: new Date().toISOString()
      }

      // Only add user_id if the user is logged in
      if (user?.id) {
        Object.assign(payload, { user_id: user.id })
      }

      const { error: insertError } = await supabase
        .from('funding_waitlist')
        .insert(payload)
      
      if (insertError) {
        console.error('Supabase error:', insertError)
        if (insertError.code === '42501') {
          throw new Error('Permission denied. The waitlist table needs to be configured with proper access policies in Supabase. Please contact support.')
        }
        throw insertError
      }
      
      setSuccess(true)
      // Clear form
      setName("")
      setEmail("")
      setOrganization("")
      setMessage("")
      setIsResearcher(false)
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setError(err.message || 'Failed to submit your information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b border-ink-100 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-ink-700">
              inkr<span className="text-accent-500">.</span>
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-ink-100 text-ink-700 rounded-full">
              beta
            </span>
          </Link>
          <Button 
            variant="outline" 
            className="border-2 hover:bg-ink-50"
            onClick={() => {
              router.push('/')
            }}
          >
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Grid background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808025_1px,transparent_1px),linear-gradient(to_bottom,#80808025_1px,transparent_1px)] bg-[size:64px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-ink-900 mb-6">
                Supporting Research Through <span className="text-accent-500">Funding</span>
              </h1>
              <p className="text-xl text-ink-600 max-w-3xl mx-auto">
                In response to recent NIH funding cuts, we're connecting donors directly with impactful research labs
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 relative">
        <div className="container mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            {/* Initiative Overview */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-ink-100"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-accent-50 flex items-center justify-center">
                    <svg className="w-16 h-16 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <h2 className="text-2xl font-bold text-ink-900 mb-4">Our Funding Initiative</h2>
                  <p className="text-ink-600 mb-4">
                    Recent cuts to NIH funding have left many critical research projects in jeopardy. At inkr, we recognize the importance of these projects and are developing a platform to connect donors directly with impactful research labs.
                  </p>
                  <p className="text-ink-600 mb-4">
                    We're currently reaching out to the research labs in our database to identify projects that need funding support, and establishing a secure, transparent system for directing contributions to these vital projects.
                  </p>
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg mt-6">
                    <h3 className="font-semibold text-orange-800">Initiative Status: In Progress</h3>
                    <p className="text-orange-700 text-sm mt-1">
                      We're currently in the outreach phase, connecting with labs to understand their specific funding needs.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* The Funding Gap */}
            <motion.div 
              variants={itemVariants}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-ink-900 mb-6">
                The Research Funding Gap
              </h2>
              <div className="bg-white rounded-2xl shadow-lg border border-ink-100 overflow-hidden">
                <div className="p-8">
                  <p className="text-ink-600 mb-4">
                    The current landscape of research funding faces significant challenges:
                  </p>
                  <ul className="space-y-4 mt-6">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-900">NIH Budget Constraints</h3>
                        <p className="text-ink-600 text-sm">
                          Recent budget adjustments have reduced available funding for many critical research areas.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-900">Increased Competition</h3>
                        <p className="text-ink-600 text-sm">
                          More researchers competing for fewer grants means many promising projects go unfunded.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-900">Early-Stage Research at Risk</h3>
                        <p className="text-ink-600 text-sm">
                          Novel, high-risk/high-reward research is often the first to lose funding during cutbacks.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="bg-ink-50 p-8 border-t border-ink-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-ink-900">Our Solution</h3>
                  </div>
                  <p className="text-ink-600">
                    We're creating a direct connection between passionate individuals who want to support science and the labs doing groundbreaking work. This bridge will help ensure promising research continues despite traditional funding challenges.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* How It Works */}
            <motion.div 
              variants={itemVariants}
              className="mb-12"
            >
              <h2 className="text-3xl font-bold text-ink-900 mb-6">
                How Our Funding Initiative Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-md border border-ink-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent-100 flex items-center justify-center text-accent-600 font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-ink-900 mb-3">Lab Outreach</h3>
                  <p className="text-ink-600">
                    We're contacting labs in our database to understand their funding needs and projects that require support.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-ink-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent-100 flex items-center justify-center text-accent-600 font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-ink-900 mb-3">Project Verification</h3>
                  <p className="text-ink-600">
                    Each project is verified for scientific merit, impact potential, and transparency in how funds will be used.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-ink-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-accent-100 flex items-center justify-center text-accent-600 font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-ink-900 mb-3">Direct Connection</h3>
                  <p className="text-ink-600">
                    Donors will be able to browse projects, learn about the research, and contribute directly to the labs.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-ink-100">
                <div className="p-8">
                  <h3 className="text-xl font-semibold text-ink-900 mb-4">Transparency & Accountability</h3>
                  <p className="text-ink-600 mb-4">
                    We're building our funding platform with these core principles:
                  </p>
                  <ul className="space-y-2 text-ink-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>100% of donations go directly to research labs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Regular updates from labs on research progress</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Clear reporting on how funds are being utilized</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Verification of academic credentials and institutional affiliations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Waiting List Form */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl p-8 shadow-xl border border-ink-100 mb-12"
            >
              <h2 className="text-2xl font-bold text-ink-900 mb-4">
                Join Our Funding Initiative
              </h2>
              <p className="text-ink-600 mb-6">
                Whether you're a researcher seeking funding or someone interested in supporting science, join our waiting list to be among the first to access our platform.
              </p>
              
              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You!</h3>
                  <p className="text-green-700">
                    We've added you to our waiting list. We'll be in touch when our funding platform is ready to launch.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-ink-700 mb-1">
                        Name
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium text-ink-700 mb-1">
                      Organization/University (if applicable)
                    </label>
                    <Input
                      id="organization"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-ink-700 mb-1">
                      Message (optional)
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-32"
                      placeholder="Tell us about your interest in the funding platform or any specific areas of research you're interested in supporting/seeking funding for."
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="is-researcher"
                      type="checkbox"
                      checked={isResearcher}
                      onChange={(e) => setIsResearcher(e.target.checked)}
                      className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is-researcher" className="ml-2 block text-sm text-ink-700">
                      I'm a researcher seeking funding
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-black hover:bg-black text-white relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                    >
                      <span className="relative z-10">
                        {isSubmitting ? "Submitting..." : "Join Waiting List"}
                      </span>
                      <div className="absolute inset-0 bg-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
            
            {/* Get Notified - Direct Researchers */}
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-r from-ink-100/50 to-accent-100/50 rounded-2xl p-8 shadow-xl border border-ink-100 text-center"
            >
              <h2 className="text-2xl font-bold text-ink-900 mb-4">
                Are You a Researcher?
              </h2>
              <p className="text-ink-600 mb-6 max-w-xl mx-auto">
                If you're a lab director or PI looking for funding support, we're especially interested in connecting with you. Fill out the form above and check the "I'm a researcher seeking funding" box.
              </p>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 hover:bg-ink-50"
                onClick={() => {
                  router.push('/dashboard')
                }}
              >
                Browse Research Database
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <Link href="/" className="inline-block mb-4">
              <span className="font-bold text-2xl text-ink-700">
                inkr<span className="text-accent-500">.</span>
              </span>
            </Link>
            <p className="text-gray-600 max-w-md mx-auto">
              Our mission is to connect talented individuals with impactful research opportunities and support critical scientific work.
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 