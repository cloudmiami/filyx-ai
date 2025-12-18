'use client'

import { useAuth } from '@/components/AuthProvider'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

export default function AuthTestPage() {
  const { user, signOut } = useAuth()
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Get detailed session info
    const getSessionInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Full session data:', session)
        setSessionData(session)
        setLoading(false)
      } catch (error) {
        console.error('Error getting session:', error)
        setLoading(false)
      }
    }

    getSessionInfo()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleForceSignOut = async () => {
    try {
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear cookies by setting them to expire
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })
      
      // Force page reload to clear any cached state
      window.location.reload()
    } catch (error) {
      console.error('Force sign out failed:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading auth test...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">User State from Context:</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Full Session Data:</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre>{JSON.stringify(sessionData, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Local Storage:</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre>{JSON.stringify(Object.keys(localStorage), null, 2)}</pre>
            </div>
          </div>

          <div className="space-x-4">
            <button 
              onClick={handleSignOut}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Normal Sign Out
            </button>
            
            <button 
              onClick={handleForceSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Force Clear Everything
            </button>
            
            <a 
              href="/signin"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
            >
              Go to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}