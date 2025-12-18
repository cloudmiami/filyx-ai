'use client'

import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function AuthDebugPage() {
  const { user, loading, signOut } = useAuth()

  const handleClearSession = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleCheckSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Current session:', session)
    console.log('Session error:', error)
  }

  if (loading) {
    return <div>Loading auth state...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Current Auth State</h2>
          <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
          <p><strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
          {user && (
            <div className="mt-2">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={handleClearSession}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Session & Reload
            </button>
            <button
              onClick={handleCheckSession}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Check Session (Console)
            </button>
            {user && (
              <button
                onClick={signOut}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <a href="/signin" className="text-blue-600 hover:underline">Go to Sign In</a>
          {' | '}
          <a href="/dashboard" className="text-blue-600 hover:underline">Go to Dashboard</a>
        </div>
      </div>
    </div>
  )
}