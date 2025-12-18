'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleAuthTest() {
  const [result, setResult] = useState('')

  const testAuth = async () => {
    try {
      setResult('Testing...')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setResult(`Current user: ${session.user.email}`)
      } else {
        setResult('No active session')
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const signOut = async () => {
    try {
      setResult('Signing out...')
      await supabase.auth.signOut()
      setResult('Signed out successfully')
    } catch (error) {
      setResult(`Sign out error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Auth Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Session
        </button>
        
        <button 
          onClick={signOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
        >
          Sign Out
        </button>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>{result}</p>
        </div>
      </div>
    </div>
  )
}