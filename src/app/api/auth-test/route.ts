import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    console.log('Auth test API called')
    
    // Test 1: Get Supabase client
    const supabase = await createServerSupabaseClient()
    console.log('Supabase client created')
    
    // Test 2: Try to get user directly
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('Direct auth.getUser() result:', { user: user?.email, error: error?.message })
    
    // Test 3: Try getServerUser function
    try {
      const serverUser = await getServerUser()
      console.log('getServerUser() success:', serverUser.email)
      
      return NextResponse.json({
        success: true,
        user: {
          id: serverUser.id,
          email: serverUser.email
        }
      })
    } catch (serverError) {
      console.log('getServerUser() failed:', serverError)
      
      return NextResponse.json({
        success: false,
        error: 'getServerUser failed',
        directAuthResult: {
          user: user?.email || null,
          error: error?.message || null
        }
      })
    }

  } catch (error) {
    console.error('Auth test API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}