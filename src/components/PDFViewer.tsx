'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../styles/pdf-viewer.css'

// Fallback iframe viewer when react-pdf fails
const FallbackPDFViewer = ({ fileUrl }: { fileUrl: string }) => (
  <div className="w-full border rounded-lg bg-white">
    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
      <span className="text-sm text-gray-700">PDF Viewer (Fallback Mode)</span>
      <span className="text-xs text-gray-500">react-pdf is not available</span>
    </div>
    <div className="w-full h-96">
      <iframe
        src={fileUrl}
        className="w-full h-full rounded-b-lg"
        title="PDF Document"
      />
    </div>
  </div>
)
import '../styles/pdf-viewer.css'

// Set up PDF.js worker using local file served from public directory
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js'
}

interface PDFViewerProps {
  fileUrl: string
  fileName: string
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.0)
  const [useFallback, setUseFallback] = useState(false)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setError('Failed to load PDF. The file might be corrupted or password protected.')
    setLoading(false)
    // Automatically switch to fallback on worker errors
    if (error.message.includes('worker') || error.message.includes('fetch')) {
      setUseFallback(true)
    }
  }



  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  const resetZoom = () => {
    setScale(1.0)
  }

  if (error) {
    return (
      <div className="w-full h-96 border rounded-lg flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <p className="text-xs text-gray-500">You can still download the file to view it</p>
        </div>
      </div>
    )
  }

  // Use fallback when react-pdf fails
  if (useFallback || error) {
    return <FallbackPDFViewer fileUrl={fileUrl} />
  }

  return (
    <div className="w-full border rounded-lg bg-white">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm text-gray-700">
            {loading ? 'Loading...' : `${pageNumber} of ${numPages}`}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-gray-200"
            title="Zoom out"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs rounded hover:bg-gray-200"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-gray-200"
            title="Zoom in"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex justify-center p-4 bg-gray-100 min-h-96 max-h-[600px] overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className="max-w-full"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="shadow-lg"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
      
      {numPages && numPages > 1 && (
        <div className="flex justify-center p-2 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            Use the navigation buttons above to view all {numPages} pages
          </div>
        </div>
      )}
    </div>
  )
}