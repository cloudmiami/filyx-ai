import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentCategories, documentClassifications, documentTags, tags } from '@/lib/schema'
import { eq, desc, and } from 'drizzle-orm'
import { getServerUser } from '@/lib/supabase-server-temp'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getServerUser()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const tagFilter = searchParams.get('tag')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = user.id
    
    const offset = (page - 1) * limit
    
    // Get all documents for the user first
    const allDocuments = await db
      .select({
        // Document fields
        id: documents.id,
        filename: documents.filename,
        originalName: documents.originalName,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        storageUrl: documents.storageUrl,
        processingStatus: documents.processingStatus,
        createdAt: documents.createdAt,
        // OCR fields
        extractedText: documents.extractedText,
        ocrStatus: documents.ocrStatus,
        // Classification fields
        classificationId: documentClassifications.id,
        confidence: documentClassifications.confidence,
        aiReasoning: documentClassifications.aiReasoning,
        classificationStatus: documentClassifications.classificationStatus,
        // Category fields
        categoryName: documentCategories.name,
        categoryColor: documentCategories.color,
        categoryIcon: documentCategories.icon,
      })
      .from(documents)
      .leftJoin(documentClassifications, eq(documents.id, documentClassifications.documentId))
      .leftJoin(documentCategories, eq(documentClassifications.categoryId, documentCategories.id))
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt))
    
    // Filter results based on search query and category
    let searchResults = allDocuments
    
    if (query) {
      searchResults = searchResults.filter(doc => 
        doc.originalName.toLowerCase().includes(query.toLowerCase()) ||
        doc.filename.toLowerCase().includes(query.toLowerCase()) ||
        (doc.extractedText && doc.extractedText.toLowerCase().includes(query.toLowerCase()))
      )
    }
    
    if (category) {
      searchResults = searchResults.filter(doc => doc.categoryName === category)
    }

    // Filter by tag if specified
    if (tagFilter) {
      // Get document IDs that have the specified tag
      const taggedDocuments = await db
        .select({ documentId: documentTags.documentId })
        .from(documentTags)
        .leftJoin(tags, eq(documentTags.tagId, tags.id))
        .where(and(
          eq(tags.name, tagFilter),
          eq(tags.userId, userId)
        ))

      const taggedDocumentIds = taggedDocuments.map(td => td.documentId)
      searchResults = searchResults.filter(doc => taggedDocumentIds.includes(doc.id))
    }
    
    // Apply pagination
    const paginatedResults = searchResults.slice(offset, offset + limit)
    
    return NextResponse.json({
      query,
      category,
      tag: tagFilter,
      results: paginatedResults,
      pagination: {
        page,
        limit,
        total: searchResults.length,
        totalPages: Math.ceil(searchResults.length / limit)
      }
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}