import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getServerUser, getServerSupabaseClient } from '@/lib/supabase-server-temp'

export async function GET() {
  try {
    // Get current user
    const user = await getServerUser()
    
    // Get all documents for this user
    const userDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, user.id))

    console.log(`Found ${userDocuments.length} documents for user ${user.id}`)

    // Check storage status for each document
    const supabase = await getServerSupabaseClient()
    const documentsWithStorage = []

    for (const doc of userDocuments) {
      try {
        // Try to download the file directly to test if it exists
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(doc.filename)

        const canDownload = !downloadError && fileData
        
        // Also try listing files to see structure
        const { data: listData, error: listError } = await supabase.storage
          .from('documents')
          .list('', { limit: 100 })

        documentsWithStorage.push({
          id: doc.id,
          originalName: doc.originalName,
          filename: doc.filename,
          canDownload: canDownload,
          downloadError: downloadError?.message,
          storageFiles: listData?.map(f => f.name) || [],
          listError: listError?.message,
          ocrStatus: doc.ocrStatus,
          extractedText: doc.extractedText ? 'Has text' : 'No text',
          uploadedAt: doc.createdAt
        })
      } catch (err) {
        documentsWithStorage.push({
          id: doc.id,
          originalName: doc.originalName,
          filename: doc.filename,
          canDownload: false,
          downloadError: `Check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          storageFiles: [],
          ocrStatus: doc.ocrStatus,
          extractedText: doc.extractedText ? 'Has text' : 'No text',
          uploadedAt: doc.createdAt
        })
      }
    }

    return NextResponse.json({
      totalDocuments: userDocuments.length,
      documents: documentsWithStorage,
      userId: user.id
    })

  } catch (error) {
    console.error('Debug documents error:', error)
    return NextResponse.json(
      { error: 'Failed to debug documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}