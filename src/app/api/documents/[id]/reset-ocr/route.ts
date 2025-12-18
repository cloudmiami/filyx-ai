import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getServerUser } from '@/lib/supabase-server-temp'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user (for auth validation)
    await getServerUser()
    const { id: documentId } = await params

    // Reset the OCR status to allow reprocessing
    await db
      .update(documents)
      .set({ 
        ocrStatus: 'pending',
        extractedText: null,
        ocrCompletedAt: null,
        updatedAt: new Date()
      })
      .where(eq(documents.id, documentId))

    return NextResponse.json({
      message: 'Document OCR status reset successfully',
      documentId: documentId,
      status: 'pending'
    })

  } catch (error) {
    console.error('Reset OCR API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}