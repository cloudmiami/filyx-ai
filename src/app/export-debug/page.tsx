'use client'

import { useState } from 'react'

export default function ExportDebug() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testExportAPI = async (format: string) => {
    setLoading(true)
    try {
      setResult(`Testing export API with format: ${format}...`)
      
      const response = await fetch(`/api/export?format=${format}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        if (format === 'json') {
          const data = await response.json()
          setResult(`Export Success (JSON):\n${JSON.stringify(data, null, 2)}`)
        } else {
          const text = await response.text()
          setResult(`Export Success (CSV):\n${text.substring(0, 500)}...`)
        }
      } else {
        const errorText = await response.text()
        setResult(`Export Failed:\nStatus: ${response.status}\nError: ${errorText}`)
      }

    } catch (error) {
      setResult(`Export Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testAnalyticsAPI = async () => {
    setLoading(true)
    try {
      setResult('Testing analytics API...')
      
      const response = await fetch('/api/analytics', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResult(`Analytics Success:\n${JSON.stringify(data, null, 2)}`)
      } else {
        const errorText = await response.text()
        setResult(`Analytics Failed:\nStatus: ${response.status}\nError: ${errorText}`)
      }

    } catch (error) {
      setResult(`Analytics Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuthAPI = async () => {
    setLoading(true)
    try {
      setResult('Testing auth API...')
      
      const response = await fetch('/api/auth-test', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      setResult(`Auth Test Result:\n${JSON.stringify(data, null, 2)}`)

    } catch (error) {
      setResult(`Auth Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Export & Analytics Debug</h1>
      
      <div className="space-y-4">
        <div className="space-x-2">
          <button 
            onClick={() => testExportAPI('json')}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Export (JSON)
          </button>
          
          <button 
            onClick={() => testExportAPI('csv')}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Export (CSV)
          </button>
          
          <button 
            onClick={testAnalyticsAPI}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Analytics
          </button>
          
          <button 
            onClick={testAuthAPI}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            Test Auth Debug
          </button>
        </div>
        
        {loading && <div className="text-blue-600">Loading...</div>}
        
        <div className="mt-4 p-4 bg-gray-100 rounded max-h-96 overflow-auto">
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      </div>
    </div>
  )
}