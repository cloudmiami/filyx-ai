import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentCategories, documentClassifications } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { nanoid } from 'nanoid'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Document classification prompt
const CLASSIFICATION_PROMPT = `You are an AI document classifier. Analyze the document content and classify it into one of these business categories:

Categories:
1. Invoices - Bills and invoices from vendors and suppliers
2. Contracts - Legal agreements and contracts  
3. Receipts - Purchase receipts and expense documentation
4. Tax Documents - Tax forms, returns, and related documentation
5. Legal Documents - Legal papers, agreements, and official documents
6. Financial Statements - Bank statements, financial reports, and accounting documents
7. Insurance - Insurance policies, claims, and related documents
8. Personal Documents - Personal identification and important personal papers
9. Business Documents - General business correspondence and documentation
10. Other - Uncategorized or miscellaneous documents

Instructions:
- Analyze the document content carefully
- Choose the MOST appropriate category
- Provide a confidence score between 0.00 and 1.00
- Explain your reasoning in 1-2 sentences
- If uncertain, use "Other" category with lower confidence

Respond in JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "This appears to be an invoice because it contains vendor information, itemized charges, and payment terms."
}`

interface ClassificationResult {
  category: string
  confidence: number
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }
    
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
    
    // Update document status to processing
    await db
      .update(documents)
      .set({ processingStatus: 'processing' })
      .where(eq(documents.id, documentId))
    
    try {
      // For now, we'll simulate document text extraction
      // In a real implementation, you'd extract text from PDF/images
      const documentText = `Document: ${doc.originalName}
Type: ${doc.mimeType}
Size: ${doc.sizeBytes} bytes
Filename: ${doc.filename}

[Simulated document content based on filename analysis]`
      
      // Try OpenAI classification first, fallback to rule-based
      let classificationResult: ClassificationResult
      
      try {
        console.log('Attempting OpenAI classification...')
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: CLASSIFICATION_PROMPT
            },
            {
              role: "user", 
              content: `Classify this document:\n\n${documentText}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500,
        })
        
        const response = completion.choices[0]?.message?.content
        if (!response) {
          throw new Error('No response from OpenAI')
        }
        
        // Parse JSON response
        try {
          classificationResult = JSON.parse(response)
          console.log('OpenAI classification successful:', classificationResult)
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', response)
          throw new Error('Failed to parse OpenAI response')
        }
      } catch (openaiError) {
        console.warn('OpenAI classification failed, falling back to rule-based:', openaiError)
        
        // Fallback to rule-based classification
        let category = 'Other'
        let confidence = 0.7
        let reasoning = 'Classified using filename analysis (OpenAI unavailable)'
        
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
        
        classificationResult = { category, confidence, reasoning }
        console.log('Rule-based classification result:', classificationResult)
      }
      
      // Find the category in database
      const categories = await db
        .select()
        .from(documentCategories)
        .where(eq(documentCategories.name, classificationResult.category))
      
      let categoryId: string
      if (categories.length > 0) {
        categoryId = categories[0].id
      } else {
        // Fallback to "Other" category
        const otherCategories = await db
          .select()
          .from(documentCategories)
          .where(eq(documentCategories.name, 'Other'))
        
        if (otherCategories.length > 0) {
          categoryId = otherCategories[0].id
        } else {
          throw new Error('No fallback category found')
        }
      }
      
      // Save classification result
      const classificationId = nanoid()
      await db.insert(documentClassifications).values({
        id: classificationId,
        documentId: documentId,
        categoryId: categoryId,
        confidence: classificationResult.confidence.toString(),
        isManualOverride: false,
        classificationStatus: 'completed',
        aiReasoning: classificationResult.reasoning,
      })
      
      // Update document status to completed
      await db
        .update(documents)
        .set({ processingStatus: 'completed' })
        .where(eq(documents.id, documentId))
      
      return NextResponse.json({
        success: true,
        classification: {
          id: classificationId,
          category: classificationResult.category,
          confidence: classificationResult.confidence,
          reasoning: classificationResult.reasoning,
          status: 'completed'
        }
      })
      
    } catch (aiError) {
      console.error('AI Classification error:', aiError)
      
      // Update document status to failed
      await db
        .update(documents)
        .set({ processingStatus: 'failed' })
        .where(eq(documents.id, documentId))
      
      return NextResponse.json(
        { error: 'Classification failed', details: aiError instanceof Error ? aiError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Classification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve classification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }
    
    // Get classification from database
    const classification = await db
      .select({
        id: documentClassifications.id,
        confidence: documentClassifications.confidence,
        isManualOverride: documentClassifications.isManualOverride,
        classificationStatus: documentClassifications.classificationStatus,
        aiReasoning: documentClassifications.aiReasoning,
        categoryName: documentCategories.name,
        categoryColor: documentCategories.color,
        categoryIcon: documentCategories.icon,
      })
      .from(documentClassifications)
      .leftJoin(documentCategories, eq(documentClassifications.categoryId, documentCategories.id))
      .where(eq(documentClassifications.documentId, documentId))
      .limit(1)
    
    if (classification.length === 0) {
      return NextResponse.json(
        { error: 'Classification not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      classification: classification[0]
    })
    
  } catch (error) {
    console.error('Get classification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}