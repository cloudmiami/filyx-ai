'use client'

import { useState } from 'react'

export default function AnalyticsDebug() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testAnalyticsAPI = async () => {
    setLoading(true)
    try {
      setResult('Calling analytics API...')
      
      const response = await fetch('/api/analytics', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      
      setResult(`Status: ${response.status}
Status Text: ${response.statusText}
Response: ${responseText}`)

    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testOtherAPI = async () => {
    setLoading(true)
    try {
      setResult('Calling documents API...')
      
      const response = await fetch('/api/documents/upload', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      
      setResult(`Documents API Status: ${response.status}
Status Text: ${response.statusText}
Response: ${responseText}`)

    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics API Debug</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testAnalyticsAPI}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Test Analytics API
        </button>
        
        <button 
          onClick={testOtherAPI}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Test Documents API (Working)
        </button>
        
        {loading && <div>Loading...</div>}
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      </div>
    </div>
  )
}