"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { PDFViewer } from "@/components/PDFViewer"
import { NavBar } from "@/components/NavBar"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ArrowLeft, Clock, Eye } from "lucide-react"

interface DocumentDetails {
  id: string
  display_name: string
  filename: string
  file_path: string
  description: string | null
  tags: string[]
  uploaded_at: string
  view_count: number
  collection_id: string | null
  collection_name?: string
}

// Type for the data returned from Supabase
interface DocumentQueryResult {
  id: string
  display_name: string
  filename: string
  file_path: string
  description: string | null
  tags: string[]
  uploaded_at: string
  view_count: number
  collection_id: string | null
  collection?: {
    name: string
  } | null
}

function PDFViewContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [document, setDocument] = useState<DocumentDetails | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDocument() {
      try {
        setIsLoading(true)
        
        // Get document details
        const { data: documentData, error: documentError } = await supabase
          .from('user_documents')
          .select(`
            id, display_name, filename, file_path, description, 
            tags, uploaded_at, view_count, collection_id,
            collection:pdf_collections(name)
          `)
          .eq('id', params.id)
          .single()
        
        if (documentError) throw documentError
        
        if (!documentData) {
          setError('Document not found')
          setIsLoading(false)
          return
        }
        
        // Transform document data
        const typedDocData = documentData as unknown as DocumentQueryResult
        const formattedDoc: DocumentDetails = {
          ...typedDocData,
          collection_name: typedDocData.collection?.name
        }
        
        setDocument(formattedDoc)
        
        // Get signed URL for the PDF
        const { data: urlData, error: urlError } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(typedDocData.file_path, 3600) // 1 hour expiry
        
        if (urlError) throw urlError
        
        setPdfUrl(urlData.signedUrl)
        
        // Update view count
        await supabase
          .from('user_documents')
          .update({ 
            view_count: (typedDocData.view_count || 0) + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', params.id)
        
      } catch (err) {
        console.error('Error loading document:', err)
        setError('Failed to load document')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (params.id) {
      loadDocument()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <NavBar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[#141414] border-b border-[#232323] p-4">
          <div className="max-w-7xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 text-slate-400 hover:text-white hover:bg-[#232323]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {isLoading ? (
              <div className="h-8 w-64 bg-[#232323] animate-pulse rounded"></div>
            ) : error ? (
              <h1 className="text-xl font-bold text-white">Error Loading Document</h1>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white">
                  {document?.display_name || document?.filename || 'Document'}
                </h1>
                <div className="flex items-center text-sm text-slate-400 mt-2 gap-4">
                  {document?.uploaded_at && (
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Uploaded {formatDate(document.uploaded_at)}
                    </div>
                  )}
                  {document?.view_count !== undefined && (
                    <div className="flex items-center">
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      {document.view_count} views
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* PDF Viewer */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Error</h3>
              <p className="text-slate-400 max-w-md">{error}</p>
              <Button
                className="mt-4 bg-slate-700 hover:bg-slate-600"
                onClick={() => router.push('/library')}
              >
                Return to Library
              </Button>
            </div>
          ) : !pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400">URL not available</div>
            </div>
          ) : (
            <PDFViewer 
              url={pdfUrl} 
              fileName={document?.filename || 'document.pdf'} 
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function PDFViewPage() {
  return (
    <ProtectedRoute>
      <PDFViewContent />
    </ProtectedRoute>
  )
} 