import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getServerUser, getServerSupabaseClient } from '@/lib/supabase-server-temp'

export async function POST() {
  try {
    // Get current user
    const user = await getServerUser()
    
    // Get all documents for this user
    const userDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, user.id))

    const supabase = await getServerSupabaseClient()
    
    // List all files in the temp folder
    const { data: tempFiles, error: tempError } = await supabase.storage
      .from('documents')
      .list('temp', { limit: 100 })

    if (tempError) {
      throw new Error(`Failed to list temp files: ${tempError.message}`)
    }

    const tempFileNames = tempFiles?.map(f => f.name) || []
    let fixedCount = 0

    // Fix each document's filename if needed
    for (const doc of userDocuments) {
      const currentFilename = doc.filename
      const expectedFilename = `${doc.id}.pdf`
      
      // Check if the file exists in temp folder
      if (tempFileNames.includes(expectedFilename)) {
        const correctPath = `temp/${expectedFilename}`
        
        // Update if the database path is incorrect
        if (currentFilename !== correctPath) {
          await db
            .update(documents)
            .set({ 
              filename: correctPath,
              updatedAt: new Date()
            })
            .where(eq(documents.id, doc.id))
          
          fixedCount++
          console.log(`Fixed document ${doc.id}: ${currentFilename} -> ${correctPath}`)
        }
      } else {
        console.log(`File not found in storage for document ${doc.id}: ${expectedFilename}`)
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixedCount} document filename paths`,
      totalDocuments: userDocuments.length,
      tempFiles: tempFileNames.length,
      fixedCount: fixedCount
    })

  } catch (error) {
    console.error('Fix filenames error:', error)
    return NextResponse.json(
      { error: 'Failed to fix filenames', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}