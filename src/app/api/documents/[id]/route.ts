import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentClassifications } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getServerUser, getServerSupabaseClient } from '@/lib/supabase-server-temp'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Get current user
    const user = await getServerUser()

    const { id: documentId } = await params

    // Get document from database
    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (document.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = document[0]

    // Verify ownership
    if (doc.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Try to get signed URL for file access
    const supabase = await getServerSupabaseClient()
    let { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.filename, 3600) // 1 hour expiry

    // If first attempt fails and filename doesn't include path, try with temp/ prefix
    if (urlError && !doc.filename.includes('/')) {
      const tempPath = `temp/${doc.filename}`
      const fallbackResult = await supabase.storage
        .from('documents')
        .createSignedUrl(tempPath, 3600)
      signedUrl = fallbackResult.data
      urlError = fallbackResult.error
    }

    let fileUrl = null
    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      // Don't fail the request, just set fileUrl to null
    } else if (signedUrl) {
      fileUrl = signedUrl.signedUrl
    }

    // Return document metadata and optional signed URL
    return NextResponse.json({
      document: {
        id: doc.id,
        filename: doc.filename,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        processingStatus: doc.processingStatus,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        // OCR fields
        extractedText: doc.extractedText,
        ocrStatus: doc.ocrStatus,
        ocrCompletedAt: doc.ocrCompletedAt
      },
      fileUrl: fileUrl
    })

  } catch (error) {
    console.error('Error in document view API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getServerUser()

    const { id: documentId } = await params

    // Get document from database
    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (document.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = document[0]

    // Verify ownership
    if (doc.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete file from storage
    const supabase = await getServerSupabaseClient()
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.filename])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document classifications first (foreign key constraint)
    await db
      .delete(documentClassifications)
      .where(eq(documentClassifications.documentId, documentId))

    // Delete document from database
    await db
      .delete(documents)
      .where(eq(documents.id, documentId))

    return NextResponse.json({ message: 'Document deleted successfully' })

  } catch (error) {
    console.error('Error in document delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}