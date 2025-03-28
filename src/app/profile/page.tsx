"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface UserProfile {
  id: string
  full_name: string
  institution: string
  department: string
  position: string
  research_interests: string[]
  bio: string
  website: string
  twitter: string
  linkedin: string
  orcid: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    full_name: '',
    institution: '',
    department: '',
    position: '',
    research_interests: [],
    bio: '',
    website: '',
    twitter: '',
    linkedin: '',
    orcid: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
            // Initialize with empty profile if not found
            setProfile(prev => ({ ...prev, id: user.id }))
          } else if (data) {
            // Ensure research_interests is always an array
            const research_interests = Array.isArray(data.research_interests) 
              ? data.research_interests 
              : data.research_interests 
                ? [data.research_interests] 
                : []
            
            setProfile({
              ...data,
              research_interests
            })
          }
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    getUser()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    setError(null)

    try {
      // Ensure research_interests is an array before saving
      const updatedProfile = {
        ...profile,
        research_interests: Array.isArray(profile.research_interests)
          ? profile.research_interests
          : [],
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updatedProfile)

      if (error) throw error

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interests = e.target.value.split(',').map(i => i.trim()).filter(Boolean)
    setProfile(prev => ({ ...prev, research_interests: interests }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-accent-50/10 flex items-center justify-center">
        <div className="text-ink-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-accent-50/10">
      <nav className="fixed top-0 w-full border-b border-ink-100/10 bg-white/80 backdrop-blur-xl z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-black text-2xl text-ink-900 tracking-tight">
            inkr<span className="text-accent-500">.</span>
          </span>
          <Button 
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-ink-600 hover:text-ink-900"
          >
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-16">
        <motion.div 
          className="max-w-3xl mx-auto space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-bold text-ink-900 mb-2">Your Profile</h1>
            <p className="text-ink-600">Complete your profile to enhance your research outreach experience.</p>
          </motion.div>

          {error && (
            <motion.div 
              variants={itemVariants}
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Basic Information */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg shadow-ink-100/20 border border-ink-100/40 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Basic Information</h2>
                  <p className="text-sm text-ink-600">Your primary details used in email templates</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="full_name" className="text-sm font-medium text-ink-700 block mb-2">
                    Full Name
                  </label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="institution" className="text-sm font-medium text-ink-700 block mb-2">
                      Institution
                    </label>
                    <Input
                      id="institution"
                      name="institution"
                      value={profile.institution}
                      onChange={handleChange}
                      placeholder="Enter your institution"
                      required
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="text-sm font-medium text-ink-700 block mb-2">
                      Department
                    </label>
                    <Input
                      id="department"
                      name="department"
                      value={profile.department}
                      onChange={handleChange}
                      placeholder="Enter your department"
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="position" className="text-sm font-medium text-ink-700 block mb-2">
                    Position/Year
                  </label>
                  <Input
                    id="position"
                    name="position"
                    value={profile.position}
                    onChange={handleChange}
                    placeholder="e.g., Junior undergraduate, PhD student"
                    required
                    className="bg-white"
                  />
                </div>
              </div>
            </motion.div>

            {/* Research Interests */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg shadow-ink-100/20 border border-ink-100/40 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Research Interests</h2>
                  <p className="text-sm text-ink-600">Your areas of research interest (comma-separated)</p>
                </div>
              </div>

              <div>
                <Input
                  id="research_interests"
                  name="research_interests"
                  value={profile.research_interests.join(', ')}
                  onChange={handleInterestsChange}
                  placeholder="e.g., Machine Learning, Quantum Computing, Data Science"
                  required
                  className="bg-white"
                />
              </div>
            </motion.div>

            {/* Additional Information */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg shadow-ink-100/20 border border-ink-100/40 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Additional Information</h2>
                  <p className="text-sm text-ink-600">Optional details to enhance your profile</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="bio" className="text-sm font-medium text-ink-700 block mb-2">
                    Bio
                  </label>
                  <Input
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    placeholder="A brief description of your academic background and goals"
                    className="bg-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="website" className="text-sm font-medium text-ink-700 block mb-2">
                      Website
                    </label>
                    <Input
                      id="website"
                      name="website"
                      value={profile.website}
                      onChange={handleChange}
                      placeholder="Your personal or academic website"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="orcid" className="text-sm font-medium text-ink-700 block mb-2">
                      ORCID
                    </label>
                    <Input
                      id="orcid"
                      name="orcid"
                      value={profile.orcid}
                      onChange={handleChange}
                      placeholder="Your ORCID identifier"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="twitter" className="text-sm font-medium text-ink-700 block mb-2">
                      Twitter
                    </label>
                    <Input
                      id="twitter"
                      name="twitter"
                      value={profile.twitter}
                      onChange={handleChange}
                      placeholder="Your Twitter handle"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="linkedin" className="text-sm font-medium text-ink-700 block mb-2">
                      LinkedIn
                    </label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      value={profile.linkedin}
                      onChange={handleChange}
                      placeholder="Your LinkedIn profile URL"
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div variants={itemVariants} className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white font-medium shadow-lg shadow-accent-200/20 min-w-[200px] relative overflow-hidden transition-all duration-200"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </span>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </main>
    </div>
  )
} 