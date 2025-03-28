"use client"

import { useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import { Button } from "@/components/ui/button"
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon 
} from 'lucide-react'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// Import pdfjs directly from the library
import { GlobalWorkerOptions } from 'pdfjs-dist'

interface PDFViewerProps {
  url: string
  fileName?: string
}

export function PDFViewer({ url, fileName = "document.pdf" }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Set worker source when component mounts
  useEffect(() => {
    // Set the worker source to the file in the public directory
    GlobalWorkerOptions.workerSrc = '/static/worker/pdf.worker.min.js';
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    if (pageNumber > 1) {
      changePage(-1);
    }
  }

  function nextPage() {
    if (pageNumber < numPages) {
      changePage(1);
    }
  }

  function zoomOut() {
    setScale(prevScale => Math.max(0.5, prevScale - 0.2));
  }

  function zoomIn() {
    setScale(prevScale => Math.min(3, prevScale + 0.2));
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    link.click()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between">
        <div className="flex items-center gap-1 ml-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-1 min-w-[80px] justify-center">
            <input 
              type="number"
              value={pageNumber}
              min={1}
              max={numPages || 1}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page && page > 0 && page <= numPages) {
                  setPageNumber(page);
                }
              }}
              className="w-12 text-center border rounded py-1 px-1"
            />
            <span className="text-sm text-gray-600">
              of {numPages || '?'}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ZoomOutIcon className="h-5 w-5" />
          </Button>
          
          <span className="text-sm text-gray-600 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="text-gray-700 hover:bg-gray-100"
          >
            <ZoomInIcon className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDownload}
            className="text-gray-700 hover:bg-gray-100"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-gray-100 pdf-document">
        {loading && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error("Error loading PDF:", error);
            setError(error instanceof Error ? error : new Error(String(error)));
            setLoading(false);
          }}
          options={{
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          }}
          loading={null}
          className="flex flex-col items-center py-4"
        >
          {numPages > 0 && (
            <Page
              key={pageNumber}
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="pdf-page shadow-lg"
              loading={null}
            />
          )}
        </Document>
        
        {/* Error display */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading PDF</h3>
            <p className="text-gray-600 max-w-md overflow-auto max-h-60">
              {error.message || 'There was an error loading the PDF. Please try again or download the file.'}
            </p>
            <Button
              className="mt-4"
              onClick={handleDownload}
            >
              Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 