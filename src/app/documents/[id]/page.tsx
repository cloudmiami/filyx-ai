'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 border rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading PDF viewer...</p>
      </div>
    </div>
  )
})

interface Document {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

interface DocumentViewData {
  document: Document
  fileUrl: string
}

interface Tag {
  id: string
  name: string
  color: string
}

export default function DocumentViewPage() {
  const params = useParams()
  const [documentData, setDocumentData] = useState<DocumentViewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const documentId = params.id as string

  const loadDocument = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Document not found')
        } else if (response.status === 403) {
          setError('You do not have permission to view this document')
        } else {
          setError('Failed to load document')
        }
        return
      }

      const data = await response.json()
      setDocumentData(data)
    } catch (error) {
      console.error('Error loading document:', error)
      setError('Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/')
  }

  const isPdfFile = (mimeType: string) => {
    return mimeType === 'application/pdf'
  }

  const downloadFile = () => {
    if (documentData?.fileUrl && typeof window !== 'undefined') {
      const link = window.document.createElement('a')
      link.href = documentData.fileUrl
      link.download = documentData.document.originalName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Document</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { document } = documentData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Document Preview</h1>
          </div>
          <p className="text-gray-600">View and manage your document</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                <button
                  onClick={downloadFile}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Download
                </button>
              </div>

              <div className="p-6">
                {!documentData.fileUrl ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2 5a7 7 0 1114 0v3a2 2 0 01-2 2H7a2 2 0 01-2-2v-3a7 7 0 017-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">File Not Available</h3>
                    <p className="text-gray-500 mb-4">
                      The original file is not available for preview. The document metadata has been preserved.
                    </p>
                    <p className="text-sm text-gray-400">
                      File: {document.originalName} ({formatFileSize(document.sizeBytes)})
                    </p>
                  </div>
                ) : isImageFile(document.mimeType) ? (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={documentData.fileUrl}
                      alt={document.originalName}
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      style={{ maxHeight: '600px' }}
                    />
                  </div>
                ) : isPdfFile(document.mimeType) ? (
                  <PDFViewer 
                    fileUrl={`/api/pdf-proxy/${encodeURIComponent(document.filename)}`}
                    fileName={document.originalName}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
                    <p className="text-gray-500 mb-4">
                      This file type cannot be previewed in the browser
                    </p>
                    <button
                      onClick={downloadFile}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Document Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                  <p className="text-sm text-gray-900">{document.originalName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                  <p className="text-sm text-gray-900">{document.mimeType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                  <p className="text-sm text-gray-900">{formatFileSize(document.sizeBytes)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.processingStatus)}`}>
                    {document.processingStatus}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uploaded</label>
                  <p className="text-sm text-gray-900">{formatDate(document.createdAt)}</p>
                </div>

                {document.updatedAt !== document.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Modified</label>
                    <p className="text-sm text-gray-900">{formatDate(document.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Management */}
            <DocumentTags documentId={documentId} />

            {/* Document Processing Status */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Document Processing
                </h3>
                <p className="text-sm text-gray-600 mt-1">Automatic AI text extraction and content analysis</p>
              </div>
              <div className="p-6">
                <ProcessingStatusDisplay documentId={documentId} />
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={downloadFile}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Download File
                </button>

                <Link
                  href={`/search?q=${encodeURIComponent(document.originalName.split('.')[0])}`}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Similar
                </Link>

                <Link
                  href="/dashboard"
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tags management component
function DocumentTags({ documentId }: { documentId: string }) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [documentTags, setDocumentTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)

  // Load available tags and document tags
  const loadTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }, [])

  const loadDocumentTags = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/tags`)
      if (response.ok) {
        const data = await response.json()
        setDocumentTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error loading document tags:', error)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadTags()
    loadDocumentTags()
  }, [loadTags, loadDocumentTags])

  const createTag = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: '#3B82F6' })
      })
      
      if (response.ok) {
        setNewTagName('')
        setShowAddTag(false)
        loadTags()
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const assignTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: [tagId] })
      })
      
      if (response.ok) {
        loadDocumentTags()
      }
    } catch (error) {
      console.error('Error assigning tag:', error)
    }
  }

  const removeTag = async (tagId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: [tagId] })
      })
      
      if (response.ok) {
        loadDocumentTags()
      }
    } catch (error) {
      console.error('Error removing tag:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-400">Loading tags...</p>
        </div>
      </div>
    )
  }

  const assignedTagIds = documentTags.map(tag => tag.id)
  const unassignedTags = availableTags.filter(tag => !assignedTagIds.includes(tag.id))

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
      </div>
      <div className="p-6">
        {/* Current Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Tags</label>
          {documentTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {documentTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No tags assigned</p>
          )}
        </div>

        {/* Available Tags */}
        {unassignedTags.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Tags</label>
            <div className="flex flex-wrap gap-2">
              {unassignedTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => assignTag(tag.id)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  + {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add New Tag */}
        <div>
          {!showAddTag ? (
            <button
              onClick={() => setShowAddTag(true)}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Tag
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
                onKeyPress={(e) => e.key === 'Enter' && createTag()}
              />
              <button
                onClick={createTag}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddTag(false)
                  setNewTagName('')
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Document Processing Status Display
function ProcessingStatusDisplay({ documentId }: { documentId: string }) {
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [ocrStatus, setOcrStatus] = useState<string>('pending')

  // Load existing text extraction status and refresh periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (response.ok) {
          const data = await response.json()
          setOcrStatus(data.document.ocrStatus || 'pending')
          setExtractedText(data.document.extractedText || null)
        }
      } catch (error) {
        console.error('Error checking OCR status:', error)
      }
    }
    
    checkStatus()
    
    // Refresh status every 3 seconds if processing
    const interval = setInterval(() => {
      if (ocrStatus === 'pending' || ocrStatus === 'processing') {
        checkStatus()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [documentId, ocrStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800 animate-pulse'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800 animate-pulse'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="h-4 w-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'completed': return 'Text extraction completed'
      case 'processing': return 'Processing document with AI...'
      case 'failed': return 'Text extraction failed'
      default: return 'Document processing in progress...'
    }
  }

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="text-center">
        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(ocrStatus)}`}>
          {getStatusIcon(ocrStatus)}
          {getStatusMessage(ocrStatus)}
        </span>
      </div>

      {ocrStatus === 'pending' && (
        <div className="text-center text-sm text-gray-600">
          <p>Document will be automatically processed with AI text extraction</p>
        </div>
      )}

      {/* Show extracted text preview */}
      {extractedText && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Extracted Text Preview
          </h4>
          <div className="text-sm text-gray-700 max-h-40 overflow-y-auto bg-white p-3 rounded border">
            {extractedText.substring(0, 500)}
            {extractedText.length > 500 && (
              <span className="text-gray-500 italic">... ({extractedText.length - 500} more characters)</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            This content is searchable across your documents
          </div>
        </div>
      )}
    </div>
  )
}