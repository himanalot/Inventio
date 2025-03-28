"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Template = {
  id: string
  name: string
  subject: string
  body: string
}

type SavedDraft = {
  id: string
  name: string
  subject: string
  body: string
  professor_email?: string
  professor_name?: string
  research_topic?: string
  created_at: string
  variables?: Record<string, string>
}

type Variable = {
  key: string
  label: string
  value: string
  description: string
  example: string
  source: 'search' | 'profile' | 'manual'
  readonly?: boolean
}

export default function EmailTemplates() {
  const router = useRouter()
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [activeDraft, setActiveDraft] = useState<SavedDraft | null>(null)
  const [drafts, setDrafts] = useState<SavedDraft[]>([])
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [professorEmail, setProfessorEmail] = useState("")
  const [professorName, setProfessorName] = useState("")
  const [researchTopic, setResearchTopic] = useState("")
  const [draftName, setDraftName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showVariables, setShowVariables] = useState(false)
  const [newVariable, setNewVariable] = useState<{name: string, value: string, description: string}>({
    name: '',
    value: '',
    description: ''
  })
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([])

  // Base variables that are always available
  const baseVariables: Variable[] = [
    {
      key: "Professor Email",
      label: "Professor Email",
      value: "",
      description: "The professor's email address (automatically filled from search)",
      example: "professor@university.edu",
      source: "search",
      readonly: true
    },
    {
      key: "Professor Name",
      label: "Professor Name",
      value: "",
      description: "The professor's name (automatically filled from search)",
      example: "Dr. Smith",
      source: "search",
      readonly: true
    },
    {
      key: "Research Topic",
      label: "Research Topic",
      value: "",
      description: "The research topic from your search",
      example: "quantum computing algorithms",
      source: "search",
      readonly: true
    },
    {
      key: "Your Name",
      label: "Your Name",
      value: "",
      description: "Your full name from your profile",
      example: "Jane Smith",
      source: "profile"
    },
    {
      key: "University",
      label: "University",
      value: "",
      description: "Your university or institution name",
      example: "Stanford University",
      source: "profile"
    },
    {
      key: "Department",
      label: "Department",
      value: "",
      description: "Your academic department or field of study",
      example: "Computer Science",
      source: "profile"
    },
    {
      key: "Position",
      label: "Position",
      value: "",
      description: "Your current academic position",
      example: "Junior undergraduate",
      source: "profile"
    },
    {
      key: "Research Interests",
      label: "Research Interests",
      value: "",
      description: "Your research interests as listed in your profile",
      example: "machine learning, quantum computing",
      source: "profile"
    }
  ]

  const baseTemplates = [
    {
      id: 'initial',
      name: 'Initial Outreach',
      subject: 'Research Opportunity Inquiry - [Your Name]',
      body: `Dear Professor [Professor Name],

I am a [Position] at [University] in the [Department] department, and I came across your research on [Research Topic]. I'm particularly intrigued by your work and would love to learn more about potential research opportunities in your lab.

My research interests include [Research Interests], and I'm eager to contribute to your work in this area.

Would you be open to discussing potential research opportunities? I would greatly appreciate a brief meeting to learn more about your work.

Best regards,
[Your Name]`
    },
    {
      id: 'followup',
      name: 'Follow-up',
      subject: 'Following Up - Research Opportunity Inquiry',
      body: `Dear Professor [Professor Name],

I hope this email finds you well. I reached out last week about potential research opportunities in your lab. I understand you must be very busy, but I wanted to express my continued interest in contributing to your work on [Research Topic].

I would greatly appreciate any information about potential opportunities to get involved.

Best regards,
[Your Name]`
    }
  ]

  useEffect(() => {
    // Initialize availableVariables with baseVariables
    setAvailableVariables(baseVariables)
  }, [])

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
          // Only show guide if user hasn't seen it before
          setShowGuide(!profile.has_seen_email_guide)
          
          // Mark guide as seen
          if (!profile.has_seen_email_guide) {
            await supabase
              .from('profiles')
              .update({ has_seen_email_guide: true })
              .eq('id', user.id)
          }
        }

        // Load drafts
        const { data: drafts } = await supabase
          .from('email_drafts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (drafts) {
          setDrafts(drafts)
        }
      }
    }
    loadUserData()
  }, [supabase])

  const handleTemplateSelect = (template: Template) => {
    setActiveTemplate(template)
    setActiveDraft(null)
    setEditedSubject(template.subject)
    setEditedBody(template.body)
    setDraftName(`${template.name} Draft`)
    setProfessorEmail('[Professor Email]')
    
    // Initialize variables with profile and search data
    const initialVariables: Record<string, string> = {}
    
    // Add profile-based variables
    if (userProfile) {
      initialVariables['Your Name'] = userProfile.full_name || ''
      initialVariables['University'] = userProfile.institution || ''
      initialVariables['Department'] = userProfile.department || ''
      initialVariables['Position'] = userProfile.position || ''
      initialVariables['Research Interests'] = Array.isArray(userProfile.research_interests)
        ? userProfile.research_interests.join(', ')
        : userProfile.research_interests || ''
    }
    
    // Add search-based variables if available
    if (userProfile?.last_search_result) {
      const searchResult = JSON.parse(userProfile.last_search_result)
      setProfessorName(searchResult.professor_name || "")
      setResearchTopic(searchResult.research_topic || "")
      initialVariables['Professor Name'] = searchResult.professor_name || ""
      initialVariables['Research Topic'] = searchResult.research_topic || ""
    }
    
    setVariables(initialVariables)
    
    // Update available variables with current values
    const updatedBaseVariables = baseVariables.map(variable => ({
      ...variable,
      value: initialVariables[variable.key] || ''
    }))
    setAvailableVariables(updatedBaseVariables)
  }

  const handleDraftSelect = (draft: SavedDraft) => {
    setActiveDraft(draft)
    setActiveTemplate(null)
    setEditedSubject(draft.subject)
    setEditedBody(draft.body)
    setDraftName(draft.name)
    setProfessorEmail(draft.professor_email || "")
    setProfessorName(draft.professor_name || "")
    setResearchTopic(draft.research_topic || "")
    
    // Initialize variables with profile and search data
    const initialVariables: Record<string, string> = {}
    
    // Add profile-based variables
    if (userProfile) {
      initialVariables['Your Name'] = userProfile.full_name || ''
      initialVariables['University'] = userProfile.institution || ''
      initialVariables['Department'] = userProfile.department || ''
      initialVariables['Position'] = userProfile.position || ''
      initialVariables['Research Interests'] = Array.isArray(userProfile.research_interests)
        ? userProfile.research_interests.join(', ')
        : userProfile.research_interests || ''
    }
    
    // Add draft variables
    if (draft.variables) {
      Object.assign(initialVariables, draft.variables)
    }
    
    setVariables(initialVariables)
    
    // Update available variables with current values
    const updatedBaseVariables = baseVariables.map(variable => ({
      ...variable,
      value: initialVariables[variable.key] || ''
    }))
    
    // Add custom variables from the draft
    if (draft.variables) {
      const customVars = Object.entries(draft.variables)
        .filter(([key]) => !baseVariables.some(v => v.key === key))
        .map(([key, value]) => ({
          key,
          label: key,
          value,
          description: `Custom variable for ${draft.name}`,
          example: value,
          source: 'manual' as const
        }))
      
      setAvailableVariables([...updatedBaseVariables, ...customVars])
    } else {
      setAvailableVariables(updatedBaseVariables)
    }
  }

  const handleSaveDraft = async () => {
    if (!activeTemplate && !activeDraft) return
    
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const draft = {
        user_id: user.id,
        template_id: activeTemplate?.id,
        name: draftName,
        subject: editedSubject,
        body: editedBody,
        professor_email: professorEmail,
        professor_name: professorName,
        research_topic: researchTopic,
        variables: variables
      }

      if (activeDraft) {
        // Update existing draft - don't include created_at
        const { error } = await supabase
          .from('email_drafts')
          .update({
            ...draft,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeDraft.id)

        if (error) throw error
      } else {
        // Create new draft - include created_at
        const { error } = await supabase
          .from('email_drafts')
          .insert({
            ...draft,
            created_at: new Date().toISOString()
          })

        if (error) throw error
      }

      // Refresh drafts
      const { data: newDrafts } = await supabase
        .from('email_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (newDrafts) {
        setDrafts(newDrafts)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getVariableValue = (key: string) => {
    // If there's a non-empty value in variables, use it
    if (variables[key] && variables[key].trim() !== '') return variables[key]
    
    // Otherwise fall back to profile/search based values
    if (userProfile) {
      switch (key) {
        case 'Professor Email':
          return professorEmail || null
        case 'Professor Name':
          return professorName || null
        case 'Research Topic':
          return researchTopic || null
        case 'Your Name':
          return userProfile.full_name || null
        case 'University':
          return userProfile.institution || null
        case 'Department':
          return userProfile.department || null
        case 'Position':
          return userProfile.position || null
        case 'Research Interests':
          return Array.isArray(userProfile.research_interests) 
            ? userProfile.research_interests.join(', ')
            : userProfile.research_interests || null
        default:
          return null
      }
    }
    return null
  }

  const previewEmail = () => {
    let preview = editedSubject + '\n\n' + editedBody
    availableVariables.forEach(variable => {
      const value = getVariableValue(variable.key) || variable.value
      // Only replace exact variable matches with proper brackets
      const exactVariableMatches = [
        `[${variable.key}]`,
        `[${variable.label}]`,
        `[Your ${variable.key}]`,
        `[Your ${variable.label}]`
      ]
      if (value && value !== '[Professor Email]') { // Don't replace [Professor Email] with empty value
        exactVariableMatches.forEach(match => {
          preview = preview.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
        })
      }
    })
    return preview
  }

  const insertVariable = (variable: Variable) => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement) {
      const start = activeElement.selectionStart || 0
      const end = activeElement.selectionEnd || 0
      const currentValue = activeElement.value
      const variableText = `[${variable.label}]`
      const newValue = currentValue.substring(0, start) + variableText + currentValue.substring(end)
      
      // Store the element reference and cursor position
      const elementId = activeElement.id
      const newCursorPosition = start + variableText.length

      // Update the state based on the element ID
      if (elementId === 'subject') {
        setEditedSubject(newValue)
      } else if (elementId === 'body') {
        setEditedBody(newValue)
      } else if (elementId === 'professor_email') {
        setProfessorEmail(newValue)
      }

      // Close the popover
      const popoverTrigger = document.querySelector('[data-state="open"]')
      if (popoverTrigger instanceof HTMLElement) {
        popoverTrigger.click()
      }

      // Restore focus and cursor position after state update
      requestAnimationFrame(() => {
        const element = document.getElementById(elementId)
        if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
          element.focus()
          element.selectionStart = newCursorPosition
          element.selectionEnd = newCursorPosition
        }
      })
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('email_drafts')
        .delete()
        .eq('id', draftId)

      if (error) throw error

      // Update drafts list
      setDrafts(drafts.filter(draft => draft.id !== draftId))
      
      // Clear active draft if it was deleted
      if (activeDraft?.id === draftId) {
        setActiveDraft(null)
        setEditedSubject("")
        setEditedBody("")
        setDraftName("")
        setProfessorEmail("")
        setProfessorName("")
        setResearchTopic("")
        setVariables({})
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  const handleAddVariable = async () => {
    if (!newVariable.name || !newVariable.value) return

    // Check for duplicates in current draft's variables
    if (isDuplicateVariable(newVariable.name)) {
      alert('A variable with this name already exists')
      return
    }

    const newVar: Variable = {
      key: newVariable.name,
      label: newVariable.name,
      value: newVariable.value,
      description: newVariable.description,
      example: newVariable.value,
      source: 'manual'
    }

    // Update local state for variables
    setAvailableVariables(prev => [...prev, newVar])
    setVariables(prev => ({
      ...prev,
      [newVar.key]: newVar.value
    }))

    setNewVariable({ name: '', value: '', description: '' })
  }

  const isDuplicateVariable = (name: string) => {
    const normalizedName = name.toLowerCase().replace(/^your\s+/, '')
    return availableVariables.some(v => {
      const normalizedKey = v.key.toLowerCase().replace(/^your_/, '')
      const normalizedLabel = v.label.toLowerCase().replace(/^your\s+/, '')
      return normalizedName === normalizedKey || normalizedName === normalizedLabel
    })
  }

  const handleDeleteVariable = async (variableToDelete: Variable) => {
    // Only allow deletion of custom variables
    if (variableToDelete.source !== 'manual') return

    // Update local state
    setAvailableVariables(prev => prev.filter(v => v.key !== variableToDelete.key))
    setVariables(prev => {
      const { [variableToDelete.key]: _, ...rest } = prev
      return rest
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-accent-50/10">
      <nav className="fixed top-0 w-full border-b border-ink-100/10 bg-white/80 backdrop-blur-xl z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-black text-2xl text-ink-900 tracking-tight">
            inkr<span className="text-accent-500">.</span>
          </span>
          <div className="flex items-center gap-4">
            <Dialog open={showGuide} onOpenChange={setShowGuide}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Email Template Guide</DialogTitle>
                  <DialogDescription>
                    Learn how to use variables and create effective emails
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-ink-900 mb-2">Using Variables</h3>
                      <p className="text-sm text-ink-600 mb-4">
                        Variables allow you to personalize your emails automatically. Use square brackets to insert variables, like [name] or [University].
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-ink-900">Available Variables</h3>
                      
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-ink-900 mb-2">Profile Information</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Your Name]</p>
                              <p className="text-sm text-ink-600">Your full name from your profile.</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink-800">[University]</p>
                              <p className="text-sm text-ink-600">Your university or institution name.</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Department]</p>
                              <p className="text-sm text-ink-600">Your academic department or field of study.</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Position]</p>
                              <p className="text-sm text-ink-600">Your current academic position.</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Research Interests]</p>
                              <p className="text-sm text-ink-600">Your research interests as listed in your profile.</p>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-ink-900 mb-2">Professor Information</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Professor Name]</p>
                              <p className="text-sm text-ink-600">The principal investigator's name (automatically filled from search).</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Professor Email]</p>
                              <p className="text-sm text-ink-600">The principal investigator's email address (automatically filled from search).</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink-800">[Research Topic]</p>
                              <p className="text-sm text-ink-600">The research topic from your search.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-ink-900 mb-2">Tips for Using Variables</h3>
                      <ul className="space-y-2 text-sm text-ink-600">
                        <li>• Variables are case-sensitive - use them exactly as shown above</li>
                        <li>• Profile variables are automatically filled from your profile information</li>
                        <li>• Principal investigator information is pre-filled from search results when available</li>
                        <li>• You can edit any variable value manually in your drafts</li>
                        <li>• Missing variable values will show as blank in the preview</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-ink-900 mb-2">Example Usage</h3>
                      <div className="bg-ink-50 rounded-lg p-4 font-mono text-sm">
                        <p>Dear Professor [Professor Name],</p>
                        <p className="mt-2">I am a [Position] at [University] studying in the [Department] department...</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-ink-600 hover:text-ink-900"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-ink-900 mb-2">Email Templates</h1>
            <p className="text-ink-600">Customize and save email templates for reaching out to principal investigators.</p>
          </div>

          {/* Best Practices */}
          <Card className="p-6 bg-accent-50/50 border-accent-100">
            <h2 className="text-lg font-semibold text-ink-900 mb-4">Email Best Practices</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-ink-700">Keep emails concise and focused on your specific interest in their research</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-ink-700">Personalize each email with specific references to their work</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-ink-700">Avoid attachments in initial emails - they may be marked as spam</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-ink-700">Don't include links in your first email to prevent spam filtering</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-ink-700">Use a clear, professional subject line that includes your name</span>
              </li>
            </ul>
          </Card>

          {/* Templates and Editor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Template and Draft Selection */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-ink-900 mb-4">Templates</h2>
                <div className="space-y-4">
                  {baseTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        activeTemplate?.id === template.id
                          ? 'border-accent-300 bg-accent-50'
                          : 'border-ink-100 bg-white hover:border-accent-200'
                      }`}
                    >
                      <h3 className="font-medium text-ink-900">{template.name}</h3>
                      <p className="text-sm text-ink-600 mt-1">Click to edit</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Drafts */}
              <div>
                <h2 className="text-xl font-semibold text-ink-900 mb-4">Saved Drafts</h2>
                <div className="space-y-4">
                  {drafts.length > 0 ? (
                    drafts.map(draft => (
                      <div
                        key={draft.id}
                        className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                          activeDraft?.id === draft.id
                            ? 'border-accent-300 bg-accent-50'
                            : 'border-ink-100 bg-white hover:border-accent-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <button
                            onClick={() => handleDraftSelect(draft)}
                            className="flex-1 text-left"
                          >
                            <h4 className="font-medium text-ink-900">{draft.name}</h4>
                            <p className="text-sm text-ink-600 mt-1">
                              {new Date(draft.created_at).toLocaleDateString()}
                            </p>
                            {draft.professor_email && (
                              <p className="text-sm text-ink-500 mt-1">
                                To: {draft.professor_email}
                              </p>
                            )}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <svg 
                                  className="h-4 w-4 text-ink-500" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                  />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteDraft(draft.id)}
                              >
                                Delete Draft
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-ink-600">No saved drafts yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Email Editor */}
            {(activeTemplate || activeDraft) ? (
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-ink-700 block mb-2">Draft Name</label>
                    <Input
                      value={draftName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
                      placeholder="Enter a name for this draft"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-700 block mb-2">Professor's Email</label>
                    <Input
                      id="professor_email"
                      value={professorEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfessorEmail(e.target.value)}
                      placeholder="professor@university.edu"
                      type="email"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-700 block mb-2">Subject Line</label>
                    <Input
                      id="subject"
                      value={editedSubject}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-ink-700 block mb-2">Email Body</label>
                    <Textarea
                      id="body"
                      value={editedBody}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedBody(e.target.value)}
                      placeholder="Enter your email content"
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>

                  {/* Variable Management Section */}
                  <div className="flex gap-4 mb-4">
                    <Dialog open={showVariables} onOpenChange={setShowVariables}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Manage Variables
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Manage Variables</DialogTitle>
                          <DialogDescription>
                            Edit variable values and add custom variables
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[600px] pr-4">
                          <div className="space-y-6">
                            {/* Add New Variable */}
                            <div className="border rounded-lg p-4 space-y-4">
                              <h3 className="font-medium text-ink-900">Add New Variable</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-ink-700 block mb-2">Variable Name</label>
                                  <Input
                                    value={newVariable.name}
                                    onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Research Experience"
                                    className="w-full text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-ink-700 block mb-2">Variable Value</label>
                                  <Input
                                    value={newVariable.value}
                                    onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                                    placeholder="e.g., 2 years of ML research"
                                    className="w-full text-sm"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-ink-700 block mb-2">Description</label>
                                  <Input
                                    value={newVariable.description}
                                    onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of what this variable represents"
                                    className="w-full text-sm"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Button
                                    onClick={handleAddVariable}
                                    className="w-full"
                                    disabled={!newVariable.name || !newVariable.value}
                                  >
                                    Add Variable
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Existing Variables */}
                            <div className="space-y-4">
                              <h3 className="font-medium text-ink-900">Edit Variables</h3>
                              {availableVariables.map(variable => (
                                <div key={variable.key} className="border rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono text-sm text-ink-700">[{variable.key}]</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {variable.source === 'profile' ? 'From Profile' : 
                                       variable.source === 'search' ? 'From Search' : 'Custom'}
                                    </Badge>
                                    {variable.source === 'manual' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 ml-auto text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteVariable(variable)}
                                      >
                                        <svg 
                                          className="h-4 w-4" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                          />
                                        </svg>
                                        <span className="sr-only">Delete variable</span>
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm text-ink-600 mb-3">{variable.description}</p>
                                  <Input
                                    value={variables[variable.key] || variable.value || ''}
                                    onChange={(e) => {
                                      if (!variable.readonly) {
                                        const newValue = e.target.value;
                                        setVariables(prev => ({
                                          ...prev,
                                          [variable.key]: newValue
                                        }));
                                      }
                                    }}
                                    placeholder={variable.example}
                                    className={cn(
                                      "w-full text-sm",
                                      variable.readonly && "bg-ink-50 cursor-not-allowed"
                                    )}
                                    readOnly={variable.readonly}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Preview Section */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-ink-700 mb-2">Preview</h3>
                    <div className="p-4 rounded-lg bg-ink-50/50 prose prose-sm max-w-none">
                      <div className="font-medium mb-2">{previewEmail().split('\n\n')[0]}</div>
                      <div className="whitespace-pre-wrap">{previewEmail().split('\n\n').slice(1).join('\n\n')}</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleSaveDraft}
                      className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : (activeDraft ? 'Update Draft' : 'Save Draft')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={true}
                    >
                      Send Email (Coming Soon)
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 flex items-center justify-center h-[400px] bg-ink-50/50 rounded-xl border border-ink-100/40">
                <p className="text-ink-600">Select a template or draft to start editing</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 