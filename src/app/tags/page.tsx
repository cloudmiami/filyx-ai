'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface Tag {
  id: string
  name: string
  color: string
  description?: string
  createdAt: string
  updatedAt: string
}

const predefinedColors = [
  '#EF4444', // Red
  '#F97316', // Orange  
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#374151'  // Dark Gray
]

export default function TagsPage() {
  return (
    <ProtectedRoute>
      <TagsContent />
    </ProtectedRoute>
  )
}

function TagsContent() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    description: ''
  })

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        throw new Error('Failed to load tags')
      }
      
      const data = await response.json()
      setTags(data.tags)
    } catch (error) {
      console.error('Error loading tags:', error)
      setError('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Tag name is required')
      return
    }

    try {
      const isEditing = editingTag !== null
      const url = '/api/tags'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing 
        ? { ...formData, id: editingTag.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save tag')
      }

      await loadTags()
      resetForm()
      setError('')
    } catch (error) {
      console.error('Error saving tag:', error)
      setError(error instanceof Error ? error.message : 'Failed to save tag')
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || ''
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all documents.')) {
      return
    }

    try {
      const response = await fetch(`/api/tags?id=${tagId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete tag')
      }

      await loadTags()
      setError('')
    } catch (error) {
      console.error('Error deleting tag:', error)
      setError('Failed to delete tag')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#6B7280',
      description: ''
    })
    setEditingTag(null)
    setShowCreateForm(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Tags</h1>
              <p className="text-gray-600">
                Create and organize custom tags for better document organization
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tag name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this tag is for..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tags List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Tags ({tags.length})
            </h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Tag
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h10l4 4h20a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>
              <p className="text-gray-500 mb-4">Create your first tag to start organizing your documents</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Tag
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tags.map((tag) => (
                <div key={tag.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{tag.name}</h3>
                      {tag.description && (
                        <p className="text-sm text-gray-500">{tag.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created {formatDate(tag.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Tag Usage Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use descriptive names like &ldquo;Tax Forms 2025&rdquo; or &ldquo;Project Alpha&rdquo;</li>
            <li>• Choose distinct colors to quickly identify tag categories</li>
            <li>• Tags can be added to documents from the dashboard or document preview</li>
            <li>• Use tags alongside AI categories for enhanced organization</li>
            <li>• Search and filter documents by tags for quick access</li>
          </ul>
        </div>
      </div>
    </div>
  )
}