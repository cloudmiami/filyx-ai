import { NextResponse } from 'next/server'
import { getServerUser, getServerSupabaseClient } from '@/lib/supabase-server-temp'

export async function GET() {
  try {
    // Get current user
    const user = await getServerUser()
    
    const supabase = await getServerSupabaseClient()
    
    // List all files in the temp folder
    const { data: tempFiles, error: tempError } = await supabase.storage
      .from('documents')
      .list('temp', { limit: 100 })

    // List all files in root
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('documents')
      .list('', { limit: 100 })

    return NextResponse.json({
      tempFolder: {
        files: tempFiles?.map(f => f.name) || [],
        error: tempError?.message
      },
      rootFolder: {
        files: rootFiles?.map(f => f.name) || [],
        error: rootError?.message
      },
      userId: user.id
    })

  } catch (error) {
    console.error('Storage debug error:', error)
    return NextResponse.json(
      { error: 'Failed to debug storage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}