'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface UploadResult {
  id: string
  filename: string
  size: number
  type: string
  status: string
  storageUrl: string
}

interface UploadError {
  filename: string
  error: string
}

interface UploadResponse {
  success: boolean
  uploaded: number
  total: number
  results: UploadResult[]
  errors?: UploadError[]
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadContent />
    </ProtectedRoute>
  )
}

function UploadContent() {
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([])
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    setUploading(true)
    setUploadResults([])
    setUploadErrors([])
    
    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      const result: UploadResponse = await response.json()
      
      setUploadResults(result.results)
      if (result.errors) {
        setUploadErrors(result.errors)
      }
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadErrors([{
        filename: 'System Error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }])
    } finally {
      setUploading(false)
    }
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    disabled: uploading
  })
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
          <p className="text-gray-600">
            Upload your documents for AI-powered classification and organization
          </p>
        </div>
        
        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 mb-8">
          <div
            {...getRootProps()}
            className={`p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-lg text-blue-600">Uploading documents...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className="text-lg text-gray-600">
                    {isDragActive ? (
                      <span className="text-blue-600">Drop files here to upload</span>
                    ) : (
                      <>
                        <span className="font-medium text-blue-600">Click to upload</span>
                        <span> or drag and drop</span>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, DOC, DOCX, TXT, Images, Excel files up to 50MB each
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum 10 files per upload
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-green-600">
                Successfully Uploaded ({uploadResults.length})
              </h2>
            </div>
            <div className="divide-y">
              {uploadResults.map((result) => (
                <div key={result.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{result.filename}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(result.size)}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Uploaded
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-red-600">
                Upload Errors ({uploadErrors.length})
              </h2>
            </div>
            <div className="divide-y">
              {uploadErrors.map((error, index) => (
                <div key={index} className="px-6 py-4 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{error.filename}</p>
                    <p className="text-sm text-red-600">{error.error}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Automatic Processing
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">🤖 AI Classification</h4>
              <p className="text-sm text-blue-800">Documents are automatically categorized by AI (invoices, receipts, etc.)</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">📄 Text Extraction</h4>
              <p className="text-sm text-blue-800">Advanced OCR extracts all text content using IBM Docling technology</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">🔍 Smart Search</h4>
              <p className="text-sm text-blue-800">Search by filename, content, categories, or custom tags</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">⚡ Ready to Use</h4>
              <p className="text-sm text-blue-800">Documents are fully processed and searchable within minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}