'use client'

import { useState } from 'react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDocuments?: string[]
  totalDocuments: number
}

export default function ExportModal({ isOpen, onClose, selectedDocuments = [], totalDocuments }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const params = new URLSearchParams()
      params.append('format', exportFormat)
      
      if (exportScope === 'selected' && selectedDocuments.length > 0) {
        params.append('documents', selectedDocuments.join(','))
      }

      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Handle different response types
      if (exportFormat === 'json') {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        downloadBlob(blob, `filyx-documents-${new Date().toISOString().split('T')[0]}.json`)
      } else {
        const blob = await response.blob()
        downloadBlob(blob, `filyx-documents-${new Date().toISOString().split('T')[0]}.csv`)
      }

      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getExportCount = () => {
    if (exportScope === 'selected') {
      return selectedDocuments.length
    }
    return totalDocuments
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Export Documents</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What to export
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={(e) => setExportScope(e.target.value as 'all' | 'selected')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  All documents ({totalDocuments} total)
                </span>
              </label>
              {selectedDocuments.length > 0 && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="selected"
                    checked={exportScope === 'selected'}
                    onChange={(e) => setExportScope(e.target.value as 'all' | 'selected')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Selected documents ({selectedDocuments.length} selected)
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                  className="mr-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">CSV (Excel compatible)</span>
                  <p className="text-xs text-gray-500">Spreadsheet format with document metadata</p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                  className="mr-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">JSON (Developer format)</span>
                  <p className="text-xs text-gray-500">Structured data with full metadata</p>
                </div>
              </label>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Export includes:</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• Document names and metadata</li>
                  <li>• AI classification results</li>
                  <li>• Custom tags</li>
                  <li>• Upload and modification dates</li>
                  <li>• Processing status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Export {getExportCount()} Document{getExportCount() !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}