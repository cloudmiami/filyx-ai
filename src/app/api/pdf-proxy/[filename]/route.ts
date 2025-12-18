import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase-server-temp'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // Get file from Supabase storage
    const supabase = await getServerSupabaseClient()
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filename)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file content as array buffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Return file with proper headers for PDF viewing
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('PDF proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to load PDF' },
      { status: 500 }
    )
  }
}