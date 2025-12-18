import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentCategories, documentClassifications } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }
    
    console.log('Testing classification for document:', documentId)
    
    // Get document from database
    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
    
    if (document.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    const doc = document[0]
    console.log('Found document:', doc.originalName)
    
    // Update document status to processing
    await db
      .update(documents)
      .set({ processingStatus: 'processing' })
      .where(eq(documents.id, documentId))
    
    try {
      // Simple rule-based classification for testing
      let category = 'Other'
      let confidence = 0.8
      let reasoning = 'Classified based on filename pattern'
      
      const filename = doc.originalName.toLowerCase()
      if (filename.includes('receipt')) {
        category = 'Receipts'
        confidence = 0.9
        reasoning = 'Filename contains "receipt"'
      } else if (filename.includes('invoice') || filename.includes('bill')) {
        category = 'Invoices'
        confidence = 0.9
        reasoning = 'Filename suggests this is an invoice or bill'
      } else if (filename.includes('contract')) {
        category = 'Contracts'
        confidence = 0.9
        reasoning = 'Filename contains "contract"'
      } else if (filename.includes('quest') && filename.includes('billing')) {
        category = 'Invoices'
        confidence = 0.85
        reasoning = 'Quest billing document appears to be an invoice'
      }
      
      console.log('Classification result:', { category, confidence, reasoning })
      
      // Find the category in database
      const categories = await db
        .select()
        .from(documentCategories)
        .where(eq(documentCategories.name, category))
      
      console.log('Found categories:', categories)
      
      let categoryId: string
      if (categories.length > 0) {
        categoryId = categories[0].id
      } else {
        // Fallback to "Other" category
        const otherCategories = await db
          .select()
          .from(documentCategories)
          .where(eq(documentCategories.name, 'Other'))
        
        console.log('Fallback to Other categories:', otherCategories)
        
        if (otherCategories.length > 0) {
          categoryId = otherCategories[0].id
          category = 'Other'
        } else {
          throw new Error('No fallback category found')
        }
      }
      
      console.log('Using category ID:', categoryId)
      
      // Save classification result
      const classificationId = nanoid()
      await db.insert(documentClassifications).values({
        id: classificationId,
        documentId: documentId,
        categoryId: categoryId,
        confidence: confidence.toString(),
        isManualOverride: false,
        classificationStatus: 'completed',
        aiReasoning: reasoning,
      })
      
      console.log('Saved classification:', classificationId)
      
      // Update document status to completed
      await db
        .update(documents)
        .set({ processingStatus: 'completed' })
        .where(eq(documents.id, documentId))
      
      console.log('Updated document status to completed')
      
      return NextResponse.json({
        success: true,
        classification: {
          id: classificationId,
          category: category,
          confidence: confidence,
          reasoning: reasoning,
          status: 'completed'
        }
      })
      
    } catch (classificationError) {
      console.error('Classification processing error:', classificationError)
      
      // Update document status to failed
      await db
        .update(documents)
        .set({ processingStatus: 'failed' })
        .where(eq(documents.id, documentId))
      
      return NextResponse.json(
        { error: 'Classification failed', details: classificationError instanceof Error ? classificationError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Classification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}