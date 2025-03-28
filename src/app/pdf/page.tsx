"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RiGraduationCapFill } from "react-icons/ri"
import { Upload, File, X, CheckCircle, Database, FolderPlus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/components/providers/AuthProvider"
import { NavBar } from "@/components/NavBar"

interface Collection {
  id: string
  name: string
}

// Helper function to sanitize filenames
function sanitizeFilename(filename: string): string {
  // Replace quotes, special chars with underscores
  return filename
    .replace(/["']/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_');
}

function PDFUploadContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [isSettingUpDB, setIsSettingUpDB] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  
  // Form state
  const [displayName, setDisplayName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCollection, setSelectedCollection] = useState<string>("")
  const [tags, setTags] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const fetchCollections = async () => {
    try {
      // First, let's check if the table exists by doing a count query
      const { count, error: countError } = await supabase
        .from('pdf_collections')
        .select('*', { count: 'exact', head: true })
      
      // If we got a PostgreSQL error about the relation not existing
      if (countError && countError.code === '42P01') {
        setError('Collections table does not exist. Please set up the database first.')
        return
      }
      
      // If we get here, the table exists, so fetch the collections
      const { data, error } = await supabase
        .from('pdf_collections')
        .select('id, name')
        .order('name')

      if (error) throw error
      
      setCollections(data || [])
      
      // Clear the error if we successfully fetched collections
      setError(null)
    } catch (err) {
      console.error('Error fetching collections:', err)
      setError('Failed to load collections. Database tables may not be set up yet.')
    }
  }

  const createDefaultCollection = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create collections",
        variant: "destructive",
      })
      return
    }
    
    setIsCreatingCollection(true)
    
    try {
      // Check if pdf_collections table exists
      const { count, error: tableCheckError } = await supabase
        .from('pdf_collections')
        .select('*', { count: 'exact', head: true })
      
      // If table doesn't exist, try to create it
      if (tableCheckError && tableCheckError.code === '42P01') {
        await setupDatabase()
      }
      
      // Now create a default collection
      const { data, error } = await supabase
        .from('pdf_collections')
        .insert({
          user_id: user.id,
          name: 'Default Collection',
          description: 'Your default collection for storing PDF documents'
        })
        .select()
        
      if (error) throw error
      
      toast({
        title: "Success",
        description: "Default collection created successfully",
      })
      
      // Refetch collections
      await fetchCollections()
      
      // If we have a new collection, select it
      if (data && data.length > 0) {
        setSelectedCollection(data[0].id)
      }
    } catch (err) {
      console.error('Error creating default collection:', err)
      toast({
        title: "Error",
        description: "Failed to create default collection",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCollection(false)
    }
  }

  const setupDatabase = async () => {
    setIsSettingUpDB(true)
    try {
      // Call the setup-db API route
      const response = await fetch('/api/setup-db');
      
      if (!response.ok) {
        throw new Error('Failed to set up database');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Database tables created successfully",
        });
        
        // Setup storage
        const storageResponse = await fetch('/api/setup-storage');
        if (!storageResponse.ok) {
          throw new Error('Failed to set up storage');
        }
        
        // Refetch collections after setup
        await fetchCollections();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error setting up database:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to set up database",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpDB(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
      // Use filename (without extension) as default display name
      const nameWithoutExt = file.name.replace(/\.pdf$/, '')
      setDisplayName(nameWithoutExt)
    } else {
      setError('Please select a valid PDF file')
      setSelectedFile(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        toast({
          title: "Error",
          description: "Authentication error occurred",
          variant: "destructive",
        })
        return
      }

      // Sanitize the filename to remove special characters
      const sanitizedName = sanitizeFilename(selectedFile.name)
      const uniqueFilename = `${Date.now()}-${sanitizedName}`
      const filePath = `${session.user.id}/${uniqueFilename}`
      
      console.log('Uploading to path:', filePath)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = await supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath)

      // Check if user_documents table exists
      try {
        const { count, error: tableCheckError } = await supabase
          .from('user_documents')
          .select('*', { count: 'exact', head: true })
        
        if (tableCheckError && tableCheckError.code === '42P01') {
          await setupDatabase() // Create tables if they don't exist
        }
      } catch (tableError) {
        console.error("Error checking user_documents table:", tableError)
        // Try to create tables
        await setupDatabase()
      }

      const { error: insertError } = await supabase
        .from('user_documents')
        .insert({
          user_id: session.user.id,
          filename: sanitizedName,
          display_name: displayName || sanitizedName,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          public_url: urlData.publicUrl,
          collection_id: selectedCollection === "none" ? null : selectedCollection || null,
          description: description || null,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })

      if (insertError) {
        throw insertError
      }

      setUploadSuccess(true)
      toast({
        title: "Success",
        description: "PDF uploaded successfully!",
      })
      
      // Wait a moment before redirecting
      setTimeout(() => {
        router.push('/library')
      }, 1500)
    } catch (err) {
      console.error('Upload error:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to upload PDF",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Add useEffect to fetch collections when component mounts
  useEffect(() => {
    fetchCollections()
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <NavBar />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Upload PDF</h1>
            <p className="text-slate-400">
              Upload a PDF document to your library. You can organize it into a collection and add metadata.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-3">
              <p className="text-red-400">{error}</p>
              <div className="flex gap-3">
                <Button 
                  onClick={setupDatabase} 
                  disabled={isSettingUpDB}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSettingUpDB ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Set Up Database</span>
                    </div>
                  )}
                </Button>
                
                <Button 
                  onClick={createDefaultCollection} 
                  disabled={isCreatingCollection}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isCreatingCollection ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FolderPlus className="h-4 w-4" />
                      <span>Create Default Collection</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {collections.length === 0 && !error && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400 mb-2">No collections found. You can create a default collection or proceed without one.</p>
              <Button 
                onClick={createDefaultCollection} 
                disabled={isCreatingCollection}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isCreatingCollection ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FolderPlus className="h-4 w-4" />
                    <span>Create Default Collection</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#232323] rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Choose a PDF file
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Click to browse or drag and drop
                  </p>
                </div>
              ) : (
                <div className="border border-[#232323] rounded-xl p-4 bg-[#141414]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      {uploadSuccess ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <File className="h-5 w-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">
                        {selectedFile.name}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {uploadSuccess ? (
                          <span className="text-emerald-400">Upload complete</span>
                        ) : (
                          `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        )}
                      </p>
                    </div>
                    {!uploadSuccess && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-white hover:bg-[#232323]"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Form */}
            {selectedFile && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName" className="text-white">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter a display name for the document"
                    className="bg-[#141414] border-[#232323] text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="collection" className="text-white">
                    Collection (Optional)
                  </Label>
                  <Select
                    value={selectedCollection}
                    onValueChange={setSelectedCollection}
                  >
                    <SelectTrigger className="bg-[#141414] border-[#232323] text-white">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="focus:bg-slate-700 focus:text-white">No Collection</SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id} className="focus:bg-slate-700 focus:text-white">
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for the document"
                    className="bg-[#141414] border-[#232323] text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <Label htmlFor="tags" className="text-white">
                    Tags (Optional)
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Enter tags separated by commas"
                    className="bg-[#141414] border-[#232323] text-white placeholder-slate-400"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || uploadSuccess}
                    className={`w-full ${
                      uploadSuccess 
                        ? 'bg-emerald-500 hover:bg-emerald-500 cursor-default'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    } text-white`}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : uploadSuccess ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Upload Complete</span>
                      </div>
                    ) : (
                      <span>Upload PDF</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PDFUploadPage() {
  return (
    <ProtectedRoute>
      <PDFUploadContent />
    </ProtectedRoute>
  )
} 