'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ExportModal from '@/components/ExportModal'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface Document {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

interface Classification {
  id: string
  confidence: string
  isManualOverride: boolean
  classificationStatus: 'pending' | 'completed' | 'failed' | 'needs_review'
  aiReasoning: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [classifications, setClassifications] = useState<{[key: string]: Classification}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocuments = async () => {
    try {
      console.log('Loading documents...')
      const response = await fetch('/api/documents/upload')
      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Documents loaded:', data)
      setDocuments(data.documents)
      
      // Load classifications for each document
      for (const document of data.documents) {
        loadClassification(document.id)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      setError(error instanceof Error ? error.message : 'Failed to load documents')
    } finally {
      console.log('Loading complete')
      setLoading(false)
    }
  }

  const loadClassification = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/classify?documentId=${documentId}`)
      if (response.ok) {
        const data = await response.json()
        setClassifications(prev => ({
          ...prev,
          [documentId]: data.classification
        }))
      }
    } catch (error) {
      console.error('Error loading classification for document:', documentId, error)
    }
  }

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
      month: 'short',
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

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(documents.map(doc => doc.id)))
  }

  const clearSelection = () => {
    setSelectedDocuments(new Set())
    setBulkMode(false)
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document${selectedDocuments.size !== 1 ? 's' : ''}?`)) {
      return
    }

    try {
      for (const documentId of selectedDocuments) {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          throw new Error('Failed to delete document')
        }
      }
      
      // Reload documents after deletion
      await loadDocuments()
      clearSelection()
    } catch (error) {
      console.error('Error deleting documents:', error)
      setError('Failed to delete some documents')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Dashboard</h1>
          <p className="text-gray-600">
            Manage and organize your uploaded documents with AI-powered classification
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? 's' : ''} total
            </span>
            {selectedDocuments.size > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {selectedDocuments.size} selected
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            {/* Bulk Actions */}
            {selectedDocuments.size > 0 ? (
              <>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete {selectedDocuments.size}
                </button>
                <button
                  onClick={clearSelection}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {documents.length > 0 && (
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                      bulkMode 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    {bulkMode ? 'Exit Bulk Mode' : 'Select Multiple'}
                  </button>
                )}
                <Link
                  href="/tags"
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 transition-colors flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </Link>
                <Link
                  href="/analytics"
                  className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-200 transition-colors flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Link>
                <Link
                  href="/search"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Documents
                </Link>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-orange-100 text-orange-700 px-4 py-2 rounded-md hover:bg-orange-200 transition-colors flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Export
                </button>
                <Link
                  href="/upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload Documents
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m6 0h6m-6 6v6m0 0v6m0-6h6m-6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">Upload your first document to get started</p>
            <Link
              href="/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {bulkMode && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.size === documents.length && documents.length > 0}
                          onChange={(e) => e.target.checked ? selectAllDocuments() : clearSelection()}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document) => {
                    const classification = classifications[document.id]
                    return (
                      <tr key={document.id} className="hover:bg-gray-50">
                        {bulkMode && (
                          <td className="px-6 py-4 whitespace-nowrap w-16">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.has(document.id)}
                              onChange={() => toggleDocumentSelection(document.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                <Link 
                                  href={`/documents/${document.id}`}
                                  className="hover:text-blue-600 hover:underline cursor-pointer"
                                >
                                  {document.originalName}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-500">
                                {document.mimeType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {classification ? (
                            <div className="flex items-center">
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: classification.categoryColor + '20',
                                  color: classification.categoryColor 
                                }}
                              >
                                {classification.categoryName}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {Math.round(parseFloat(classification.confidence) * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              {document.processingStatus === 'processing' ? 'Classifying...' : 'Not classified'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.processingStatus)}`}>
                            {document.processingStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(document.sizeBytes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(document.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classification Info */}
        {documents.length > 0 && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">AI Classification</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Documents are automatically classified using GPT-4</li>
              <li>• Categories include Invoices, Contracts, Receipts, and more</li>
              <li>• Confidence scores show how certain the AI is about each classification</li>
              <li>• You can manually review and adjust classifications if needed</li>
            </ul>
          </div>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          selectedDocuments={Array.from(selectedDocuments)}
          totalDocuments={documents.length}
        />
      </div>
    </div>
  )
}