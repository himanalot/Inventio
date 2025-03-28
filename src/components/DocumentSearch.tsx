'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Dialog,
  DialogPortal,
  DialogTrigger,
  DialogContent
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';
import { listUserFiles, FileObject } from '@/lib/file-service';

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

// Create a custom version of DialogContent without the overlay
const CustomDialogContent = ({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPortal>
    <DialogPrimitive.Content
      className={cn(
        "fixed left-[50%] top-[50%] z-[1001] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

interface DocumentSearchProps {
  onFileSelect: (fileUrl: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function DocumentSearch({ onFileSelect, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: DocumentSearchProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user documents when the dialog opens
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }
      
      const userFiles = await listUserFiles(user.id);
      setDocuments(userFiles);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      // Reset search and selection state when opening
      setSearchQuery('');
      setSelectedIndex(0);
      // Focus the search input when dialog opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, fetchDocuments]);

  // Reset selectedIndex when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Filter documents based on search query
  const filteredDocuments = searchQuery.trim() === '' 
    ? documents 
    : documents.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectDocument = (file: FileObject) => {
    onFileSelect(file.url);
    setIsOpen(false);
  };

  // Handle keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredDocuments.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDocuments.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredDocuments[selectedIndex]) {
          handleSelectDocument(filteredDocuments[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll selected item into view when using keyboard navigation
  useEffect(() => {
    if (listContainerRef.current) {
      const selectedElement = listContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Get appropriate icon for document type
  const getDocumentIcon = (fileType: string, name: string) => {
    // Check if it's a PDF file
    if (fileType.includes('pdf') || name.toLowerCase().endsWith('.pdf')) {
      return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Check if it's a chat or conversation
    if (name.toLowerCase().includes('chat') || name.toLowerCase().includes('conversation')) {
      return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    }
    
    // Check if it's a webpage or URL
    if (name.toLowerCase().includes('http') || name.toLowerCase().includes('www')) {
      return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    }
    
    // Default document icon
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search documents</span>
        </Button>
      </DialogTrigger>
      <CustomDialogContent className="sm:max-w-md p-0 z-[1001]">
        <div className="flex flex-col h-[550px] overflow-hidden" onKeyDown={handleKeyDown}>
          {/* Search input */}
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search your library..."
                className="w-full pl-10 pr-4 py-2 text-base border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">↓</kbd>
              <span className="mr-2">to navigate</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">Enter</kbd>
              <span className="mr-2">to select</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md mr-1">Esc</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Library section */}
          <div className="flex-1 overflow-y-auto" ref={listContainerRef}>
            <div className="p-2">
              <h3 className="text-base font-medium px-2 py-1">Library</h3>
              
              {/* Document list */}
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <span className="loader-gray"></span>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    {searchQuery.trim() === '' ? 'No documents found' : `No results for "${searchQuery}"`}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredDocuments.map((file, index) => (
                      <button
                        key={file.id}
                        data-index={index}
                        className={`flex items-center gap-3 w-full px-2 py-2 text-left text-sm rounded-md transition-colors ${
                          selectedIndex === index 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleSelectDocument(file)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        {getDocumentIcon(file.type, file.name)}
                        <span className="truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: loaderStyle }} />
      </CustomDialogContent>
    </Dialog>
  );
} 