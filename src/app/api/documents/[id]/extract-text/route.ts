import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { documents } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getServerUser, getServerSupabaseClient } from '@/lib/supabase-server-temp'

const execAsync = promisify(exec)

export async function POST(
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

    // Check if already processed
    if (doc.ocrStatus === 'completed' && doc.extractedText) {
      return NextResponse.json({
        message: 'Document already processed',
        extractedText: doc.extractedText,
        status: 'completed'
      })
    }

    // Update status to processing
    await db
      .update(documents)
      .set({ 
        ocrStatus: 'processing',
        updatedAt: new Date()
      })
      .where(eq(documents.id, documentId))

    try {
      // Get file from Supabase storage
      const supabase = await getServerSupabaseClient()
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.filename)

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`)
      }

      // Save file temporarily for processing
      const tempDir = path.join(process.cwd(), 'temp')
      const tempFilePath = path.join(tempDir, `${documentId}_${doc.originalName}`)
      
      // Ensure temp directory exists (Windows compatible)
      const { mkdirSync } = await import('fs')
      try {
        mkdirSync(tempDir, { recursive: true })
      } catch {
        // Directory might already exist, that's ok
      }
      
      // Write file to temp location
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      writeFileSync(tempFilePath, buffer)

      try {
        // Process with Docling
        const pythonPath = 'C:/Users/manue/filyx/filyx-ai/.venv/Scripts/python.exe'
        const scriptPath = path.join(process.cwd(), 'scripts', 'docling_processor.py')
        
        const { stdout, stderr } = await execAsync(
          `"${pythonPath}" "${scriptPath}" "${tempFilePath}"`,
          { timeout: 300000 } // 5 minute timeout
        )

        if (stderr) {
          console.error('Docling stderr:', stderr)
        }

        // Parse Docling results
        const result = JSON.parse(stdout)

        if (!result.success) {
          throw new Error(result.error || 'Docling processing failed')
        }

        // Update document with extracted text
        await db
          .update(documents)
          .set({
            extractedText: result.extracted_text,
            ocrStatus: 'completed',
            ocrCompletedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(documents.id, documentId))

        // Clean up temp file
        unlinkSync(tempFilePath)

        return NextResponse.json({
          message: 'Document processed successfully',
          extractedText: result.extracted_text,
          metadata: result.metadata,
          status: 'completed'
        })

      } catch (processingError) {
        // Clean up temp file on error
        try {
          unlinkSync(tempFilePath)
        } catch (cleanupError) {
          console.error('Failed to cleanup temp file:', cleanupError)
        }
        throw processingError
      }

    } catch (error) {
      console.error('Document processing error:', error)
      
      // Update status to failed
      await db
        .update(documents)
        .set({ 
          ocrStatus: 'failed',
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))

      return NextResponse.json(
        { error: 'Document processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Extract text API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}