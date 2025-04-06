'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { listUserFiles, uploadFile, deleteFile, uploadFileWithGemini, type FileObject } from '@/lib/file-service';
import { getCurrentUser } from '@/lib/supabase';

// Add loader style
const loaderStyle = `
.loader-gray {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  border: 2px solid;
  border-color: #888 #888 transparent transparent;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

type FileLibraryProps = {
  onFileSelect: (fileUrl: string) => void;
};

export default function FileLibrary({ onFileSelect }: FileLibraryProps) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user and their files
  useEffect(() => {
    async function fetchUserAndFiles() {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        
        if (!user) {
          setError('Please log in to view your files');
          setLoading(false);
          return;
        }
        
        setUserId(user.id);
        const userFiles = await listUserFiles(user.id);
        setFiles(userFiles);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load files');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserAndFiles();
  }, []);

  // This effect will refresh the document list when the component is already mounted
  // and a login/authentication state change occurs
  useEffect(() => {
    // Create an event listener for auth state changes
    const handleAuthChange = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        
        if (user) {
          setUserId(user.id);
          const userFiles = await listUserFiles(user.id);
          setFiles(userFiles);
          setError(null); // Clear any previous errors
        } else {
          setUserId(null);
        }
      } catch (err) {
        console.error('Error refreshing files after auth change:', err);
      } finally {
        setLoading(false);
      }
    };

    // Listen for custom auth state change events
    window.addEventListener('auth-state-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      setError('Please log in to upload files');
      return;
    }
    
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    
    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Use the new uploadFileWithGemini function which handles both uploading
      // and creating a conversation with Gemini-generated content
      const { fileObject, conversationId } = await uploadFileWithGemini(userId, file);
      
      console.log("File uploaded successfully, got fileObject:", fileObject);
      
      // Add to local files list immediately for instant UI update
      setFiles(prevFiles => [fileObject, ...prevFiles]);
      
      if (conversationId) {
        console.log(`Created conversation with Gemini content for document: ${fileObject.name}, conversation ID: ${conversationId}`);
      } else {
        console.warn(`Failed to create Gemini conversation for document: ${fileObject.name}`);
      }
      
      // Reset file input
      e.target.value = '';
      
      // Force refresh the entire list from server to ensure parent component has latest data
      const refreshedFiles = await listUserFiles(userId);
      setFiles(refreshedFiles);
      
      // Dispatch event with actual fileObject, not just URL
      // Let the parent component handle navigation and document loading
      window.dispatchEvent(new CustomEvent('file-uploaded', { 
        detail: {
          fileObject,
          forceRefresh: true
        }
      }));
      
      // We no longer need to manipulate the URL or call onFileSelect directly
      // The file-uploaded event will take care of this in the parent component
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file: FileObject) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }
    
    try {
      console.log(`Starting to delete file: ${file.path}`);
      await deleteFile(file.path);
      
      // Update local files list
      setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
      
      // Create and dispatch custom event for file deletion
      const fileDeletedEvent = new CustomEvent('file-deleted', { 
        detail: {
          filePath: file.path
        }
      });
      console.log(`Dispatching file-deleted event for path: ${file.path}`, fileDeletedEvent);
      window.dispatchEvent(fileDeletedEvent);
      
      console.log(`File deleted and event dispatched: ${file.path}`);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="loader-gray"></span>
        <p className="mt-3 text-sm text-gray-600">Loading your documents... (if page is continuously loading, please use Safari.)</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="w-full p-6 text-center">
        <p className="text-gray-500 mb-4">Authentication required to view documents</p>
        <div className="mt-4">
          <span className="loader-gray mx-auto"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Your Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload and manage your PDF documents
        </p>
      </div>
      
      {/* Upload button */}
      <div className="p-4 border-b">
        <div className="flex items-center">
          <label 
            htmlFor="file-upload" 
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <div className="flex items-center">
                <span className="loader-gray mr-2" style={{ width: '16px', height: '16px' }}></span>
                <span>Uploading...</span>
              </div>
            ) : 'Upload PDF'}
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
          <p className="ml-4 text-sm text-muted-foreground">
            Maximum file size: 10MB
          </p>
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
      
      {/* File list */}
      <div className="flex-1 overflow-auto p-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>You haven't uploaded any documents yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-full">
            {files.map((file) => (
              <div 
                key={file.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="font-medium text-foreground truncate">{file.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>|</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto md:ml-4 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onFileSelect(file.url)}
                    >
                      Open
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteFile(file)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add style tag for loader */}
      <style dangerouslySetInnerHTML={{ __html: loaderStyle }} />
    </div>
  );
} 