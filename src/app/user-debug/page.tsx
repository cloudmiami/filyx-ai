'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function UserDebug() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const checkAuthUsers = async () => {
    setLoading(true)
    try {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setResult('No active session')
        return
      }

      setResult(`Current Session User ID: ${session.user.id}
Email: ${session.user.email}
Created: ${session.user.created_at}
Last Sign In: ${session.user.last_sign_in_at}

User should be in Supabase auth.users table with ID: ${session.user.id}`)

    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const checkPublicUsers = async () => {
    setLoading(true)
    try {
      // Check if there's a public.users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10)

      if (error) {
        setResult(`Public users table error: ${error.message}`)
      } else {
        setResult(`Public users table data: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Debug</h1>
      
      <div className="space-y-4">
        <button 
          onClick={checkAuthUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Check Auth Session
        </button>
        
        <button 
          onClick={checkPublicUsers}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          Check Public Users Table
        </button>
        
        {loading && <div>Loading...</div>}
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      </div>
    </div>
  )
}