import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentCategories, documentClassifications, documentTags, tags } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getServerUser } from '@/lib/supabase-server-temp'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getServerUser()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const documentIds = searchParams.get('documents')?.split(',')

    // Get documents with all related data
    const documentsQuery = db
      .select({
        // Document fields
        id: documents.id,
        filename: documents.filename,
        originalName: documents.originalName,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        processingStatus: documents.processingStatus,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        // Classification fields
        categoryName: documentCategories.name,
        categoryColor: documentCategories.color,
        confidence: documentClassifications.confidence,
        classificationStatus: documentClassifications.classificationStatus,
        aiReasoning: documentClassifications.aiReasoning,
      })
      .from(documents)
      .leftJoin(documentClassifications, eq(documents.id, documentClassifications.documentId))
      .leftJoin(documentCategories, eq(documentClassifications.categoryId, documentCategories.id))
      .where(eq(documents.userId, user.id))

    const documentsData = await documentsQuery

    // Filter by specific document IDs in JavaScript if provided
    let filteredDocuments = documentsData
    if (documentIds && documentIds.length > 0) {
      filteredDocuments = documentsData.filter(doc => documentIds.includes(doc.id))
    }

    // Get tags for each document
    const documentTagsQuery = await db
      .select({
        documentId: documentTags.documentId,
        tagName: tags.name,
        tagColor: tags.color,
        tagDescription: tags.description
      })
      .from(documentTags)
      .leftJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(tags.userId, user.id))

    // Group tags by document ID
    const documentTagsMap = documentTagsQuery.reduce((acc, row) => {
      if (!acc[row.documentId]) {
        acc[row.documentId] = []
      }
      if (row.tagName) {
        acc[row.documentId].push({
          name: row.tagName,
          color: row.tagColor || '#6B7280',
          description: row.tagDescription || ''
        })
      }
      return acc
    }, {} as Record<string, Array<{ name: string; color: string; description: string }>>)

    // Use filtered documents if document IDs were specified
    const targetDocuments = documentIds && documentIds.length > 0 
      ? filteredDocuments 
      : documentsData

    // Combine documents with their tags
    const enrichedDocuments = targetDocuments.map(doc => ({
      ...doc,
      tags: documentTagsMap[doc.id] || []
    }))

    if (format === 'json') {
      return NextResponse.json({
        documents: enrichedDocuments,
        exportedAt: new Date().toISOString(),
        totalCount: enrichedDocuments.length
      })
    }

    // Generate CSV
    if (format === 'csv') {
      const csvHeaders = [
        'Document Name',
        'File Type',
        'File Size (bytes)',
        'Processing Status',
        'Category',
        'Classification Confidence',
        'Classification Status',
        'Tags',
        'Upload Date',
        'Last Modified'
      ]

      const csvRows = enrichedDocuments.map(doc => [
        doc.originalName,
        doc.mimeType,
        doc.sizeBytes.toString(),
        doc.processingStatus,
        doc.categoryName || 'Not classified',
        doc.confidence ? (parseFloat(doc.confidence) * 100).toFixed(1) + '%' : 'N/A',
        doc.classificationStatus || 'N/A',
        doc.tags.map(tag => tag.name).join('; '),
        new Date(doc.createdAt).toLocaleDateString(),
        new Date(doc.updatedAt).toLocaleDateString()
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="filyx-documents-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })

  } catch (error) {
    console.error('Error in export API:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}