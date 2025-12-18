import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getServerUser } from '@/lib/supabase-server-temp'

// Supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  
  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  
  // Spreadsheets
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES_PER_REQUEST = 10

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    const userId = user.id
    
    // Ensure user exists in database (temporary fix)
    await ensureUserExists(userId)
    
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }
    
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per request` },
        { status: 400 }
      )
    }
    
    const uploadResults = []
    const errors = []
    
    for (const file of files) {
      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          errors.push({
            filename: file.name,
            error: validation.error
          })
          continue
        }
        
        // Generate unique filename
        const fileId = nanoid()
        const fileExtension = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]
        const fileName = `${fileId}${fileExtension}`
        const filePath = `temp/${fileName}` // Simplified path for development
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          errors.push({
            filename: file.name,
            error: `Upload failed: ${uploadError.message}`
          })
          continue
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)
        
        // Save document record to database
        const documentRecord = {
          id: fileId,
          userId: userId,
          filename: filePath, // Store the full path with folder
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          storageUrl: urlData.publicUrl,
          processingStatus: 'pending' as const,
        }
        
        await db.insert(documents).values(documentRecord)
        
        // Update user storage usage
        await db
          .update(users)
          .set({
            documentCount: sql`${users.documentCount} + 1`,
            storageUsedBytes: sql`${users.storageUsedBytes} + ${file.size}`,
            lastUploadAt: new Date(),
          })
          .where(eq(users.id, userId))
        
        uploadResults.push({
          id: fileId,
          filename: file.name,
          size: file.size,
          type: file.type,
          status: 'uploaded',
          storageUrl: urlData.publicUrl
        })
        
        // Trigger AI classification and text extraction asynchronously
        triggerClassificationAndExtraction(fileId)
        
      } catch (error) {
        console.error('Error uploading file:', file.name, error)
        errors.push({
          filename: file.name,
          error: 'Internal server error during upload'
        })
      }
    }
    
    // Return results
    const response = {
      success: uploadResults.length > 0,
      uploaded: uploadResults.length,
      total: files.length,
      results: uploadResults,
      errors: errors.length > 0 ? errors : undefined
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }
  
  // Check file type
  if (!SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}`
    }
  }
  
  // Check filename
  if (!file.name || file.name.trim() === '') {
    return {
      valid: false,
      error: 'Invalid filename'
    }
  }
  
  return { valid: true }
}

// Helper function to trigger AI classification and text extraction
async function triggerClassificationAndExtraction(documentId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    // First, trigger classification
    const classificationResponse = await fetch(`${baseUrl}/api/documents/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId }),
    })
    
    if (!classificationResponse.ok) {
      console.error('Classification trigger failed:', await classificationResponse.text())
    }
    
    // Trigger text extraction after classification (without delay in serverless)
    try {
      const extractionResponse = await fetch(`${baseUrl}/api/documents/${documentId}/extract-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!extractionResponse.ok) {
        console.error('Text extraction trigger failed:', await extractionResponse.text())
      } else {
        console.log(`Document ${documentId} processed successfully with Docling`)
      }
    } catch (error) {
      console.error('Error triggering text extraction:', error)
    }
    
  } catch (error) {
    console.error('Error triggering classification and extraction:', error)
  }
}

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string) {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    
    if (existingUser.length === 0) {
      // Create temporary user
      await db.insert(users).values({
        id: userId,
        email: `${userId}@temp.local`, // Temporary email
        subscriptionTier: 'free',
        documentCount: 0,
        storageUsedBytes: 0,
      })
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error)
    // Continue anyway - the error might be that user already exists
  }
}

// GET endpoint to retrieve user documents
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerUser()
    const userId = user.id
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // pending, processing, completed, failed
    
    const offset = (page - 1) * limit
    
    // Build query
    const query = db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset)
    
    // For status filter, we'll do a simple filter after the query for now
    const userDocuments = await query
    
    // Filter by status if provided
    const filteredDocuments = status 
      ? userDocuments.filter(doc => doc.processingStatus === status)
      : userDocuments
    
    // Get total count
    const totalCount = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.userId, userId))
    
    return NextResponse.json({
      documents: filteredDocuments,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit)
      }
    })
    
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}