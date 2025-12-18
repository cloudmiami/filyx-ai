'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DirectAuthTest() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState('Ready to test authentication')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setResult(`SignUp Error: ${error.message}`)
      } else {
        setResult(`SignUp Success: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`SignUp Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setResult(`SignIn Error: ${error.message}`)
      } else {
        setResult(`SignIn Success: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`SignIn Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setResult(`SignOut Error: ${error.message}`)
      } else {
        setResult('SignOut Success')
        // Clear form
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setResult(`SignOut Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetSession = async () => {
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setResult(`Session Error: ${error.message}`)
      } else {
        setResult(`Current Session: ${JSON.stringify(session, null, 2)}`)
      }
    } catch (err) {
      setResult(`Session Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Direct Authentication Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="password123"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSignUp}
              disabled={loading || !email || !password}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Sign Up
            </button>
            
            <button
              onClick={handleSignIn}
              disabled={loading || !email || !password}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Sign In
            </button>
            
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Sign Out
            </button>
            
            <button
              onClick={handleGetSession}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Get Session
            </button>
          </div>
          
          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}