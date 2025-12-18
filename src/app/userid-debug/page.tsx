'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UserIdDebug() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const getCurrentUser = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setResult(`Current authenticated user:
ID: ${session.user.id}
Email: ${session.user.email}
Created: ${session.user.created_at}

This is the user ID that should be used in the APIs instead of 'temp_user_123'`)
      } else {
        setResult('No active session found')
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testTempUserQuery = async () => {
    setLoading(true)
    try {
      setResult('Testing database query with temp user...')
      
      const response = await fetch('/api/documents/upload', {
        method: 'GET',
        credentials: 'include'
      })

      const responseText = await response.text()
      setResult(`Documents API (using temp_user_123):\nStatus: ${response.status}\nResponse: ${responseText}`)
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User ID Debug</h1>
      
      <div className="space-y-4">
        <button 
          onClick={getCurrentUser}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Get Current User ID
        </button>
        
        <button 
          onClick={testTempUserQuery}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Test Temp User Query
        </button>
        
        {loading && <div className="text-blue-600">Loading...</div>}
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      </div>
    </div>
  )
}