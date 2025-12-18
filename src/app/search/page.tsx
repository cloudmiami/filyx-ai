'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface Document {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  // Classification fields
  classificationId?: string
  confidence?: string
  aiReasoning?: string
  classificationStatus?: 'pending' | 'completed' | 'failed' | 'needs_review'
  // Category fields
  categoryName?: string
  categoryColor?: string
  categoryIcon?: string
}

interface SearchResponse {
  query: string
  category?: string
  results: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <SearchContent />
    </ProtectedRoute>
  )
}

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [searchResults, setSearchResults] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [availableTags, setAvailableTags] = useState<{id: string, name: string}[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Load available tags on component mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }
    loadTags()
  }, [])
  const [categories] = useState([
    'Invoices', 'Contracts', 'Receipts', 'Tax Documents', 
    'Legal Documents', 'Financial Statements', 'Insurance',
    'Personal Documents', 'Business Documents', 'Other'
  ])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    setLoading(true)
    setHasSearched(true)
    
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedTag) params.append('tag', selectedTag)
      
      const response = await fetch(`/api/documents/search?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }
      
      const data: SearchResponse = await response.json()
      setSearchResults(data.results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedTag('')
    setSearchResults([])
    setHasSearched(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Documents</h1>
          <p className="text-gray-600">
            Find your documents using text search or filter by category and tags
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by filename or content
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search terms..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by tag
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All tags</option>
                  {availableTags.map(tag => (
                    <option key={tag.id} value={tag.name}>{tag.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Clear
                </button>
              )}
              
              <Link
                href="/dashboard"
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200"
              >
                Back to Dashboard
              </Link>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results ({searchResults.length})
              </h2>
              {(searchQuery || selectedCategory || selectedTag) && (
                <p className="text-sm text-gray-600 mt-1">
                  {searchQuery && `Results for: "${searchQuery}"`}
                  {selectedCategory && ` in category: ${selectedCategory}`}
                  {selectedTag && ` with tag: ${selectedTag}`}
                </p>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m4 0V7m-4 8v2m4-2v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">Try adjusting your search terms or category filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                    {searchResults.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
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
                          {document.categoryName ? (
                            <div className="flex items-center">
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: document.categoryColor + '20',
                                  color: document.categoryColor 
                                }}
                              >
                                {document.categoryName}
                              </span>
                              {document.confidence && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {Math.round(parseFloat(document.confidence) * 100)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not classified</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Search Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Search by filename, document name, or keywords</li>
            <li>• Filter by specific categories to narrow results</li>
            <li>• Use partial terms (e.g., &quot;receipt&quot; finds &quot;Receipt 1416.pdf&quot;)</li>
            <li>• Combine text search with category filters for precise results</li>
          </ul>
        </div>
      </div>
    </div>
  )
}