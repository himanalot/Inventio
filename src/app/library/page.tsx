"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { RiGraduationCapFill } from "react-icons/ri"
import { 
  FolderPlus, 
  Upload, 
  Search, 
  FolderOpen, 
  File, 
  Plus,
  ChevronRight,
  ChevronDown,
  MoreVertical
} from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/components/providers/AuthProvider"
import { NavBar } from "@/components/NavBar"
import { toast } from "@/components/ui/use-toast"

interface Collection {
  id: string
  name: string
  description: string | null
  document_count: number
}

interface Document {
  id: string
  display_name: string | null
  filename: string
  file_path: string
  description: string | null
  tags: string[]
  uploaded_at: string
  collection_id: string | null
  view_count?: number
  last_viewed_at?: string
}

function LibraryContent() {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCollections()
    fetchDocuments()
  }, [selectedCollection])

  const fetchCollections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError('Authentication error. Please refresh the page.')
        return
      }

      const { data, error } = await supabase
        .from('pdf_collections')
        .select(`
          id,
          name,
          description,
          document_count:user_documents!inner(count)
        `)
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      
      const transformedData = data?.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        document_count: collection.document_count[0]?.count || 0
      })) || []
      
      setCollections(transformedData)
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError('Failed to load collections')
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError('Authentication error. Please refresh the page.')
        return
      }

      let query = supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', session.user.id)
        .order('uploaded_at', { ascending: false })

      if (selectedCollection) {
        query = query.eq('collection_id', selectedCollection)
      }

      if (searchQuery) {
        query = query.or(`
          display_name.ilike.%${searchQuery}%,
          filename.ilike.%${searchQuery}%,
          description.ilike.%${searchQuery}%
        `)
      }

      const { data, error } = await query
      if (error) throw error
      setDocuments(data || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDocuments()
  }

  const handleViewPDF = async (doc: Document) => {
    try {
      // First update the view count
      const { error: updateError } = await supabase
        .from('user_documents')
        .update({
          view_count: (doc.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', doc.id)
      
      if (updateError) throw updateError
      
      // Navigate to the document viewer page
      router.push(`/pdf/view/${doc.id}`)
      
    } catch (err) {
      console.error('Error viewing PDF:', err)
      toast({
        title: "Error",
        description: "Failed to access the document",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-white mb-2">Loading your library...</h2>
          <p className="text-[#666]">Please wait while we fetch your documents.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <NavBar />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#141414] border-r border-[#232323] p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Collections</h2>
            <Button
              size="icon"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-[#232323]"
            >
              <FolderPlus className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedCollection(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                !selectedCollection 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'text-slate-400 hover:bg-[#232323] hover:text-white'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>All Documents</span>
              <span className="ml-auto text-xs opacity-60">
                {documents.length}
              </span>
            </button>

            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedCollection === collection.id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-[#232323] hover:text-white'
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span>{collection.name}</span>
                <span className="ml-auto text-xs opacity-60">
                  {collection.document_count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">
                {selectedCollection 
                  ? collections.find(c => c.id === selectedCollection)?.name
                  : "All Documents"
                }
              </h1>
              <Button
                onClick={() => router.push('/pdf')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-[#141414] border-[#232323] text-white placeholder-slate-400 focus:border-emerald-500"
                />
              </div>
            </form>

            {/* Documents grid */}
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-[#141414] rounded-xl border border-[#232323]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <File className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No documents yet</h3>
                <p className="text-slate-400 mb-6">
                  Upload your first PDF to get started
                </p>
                <Button
                  onClick={() => router.push('/pdf')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#141414] rounded-xl border border-[#232323] p-4 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <File className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium line-clamp-1">
                            {doc.display_name || doc.filename}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-white hover:bg-[#232323]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {doc.description && (
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {doc.description}
                      </p>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {doc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-[#232323] text-slate-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPDF(doc)}
                        className="bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-500/30"
                      >
                        View PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  )
} 