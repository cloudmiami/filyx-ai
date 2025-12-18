import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentTags, tags } from '@/lib/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getServerUser } from '@/lib/supabase-server-temp'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getServerUser()

    const { id: documentId } = await params

    // Verify document ownership
    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (document.length === 0 || document[0].userId !== user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
    }

    // Get document tags
    const documentTagsData = await db
      .select({
        tagId: documentTags.tagId,
        tagName: tags.name,
        tagColor: tags.color,
        tagDescription: tags.description,
        createdAt: documentTags.createdAt
      })
      .from(documentTags)
      .leftJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, documentId))
      .orderBy(tags.name)

    return NextResponse.json({ 
      documentId,
      tags: documentTagsData.map(tag => ({
        id: tag.tagId,
        name: tag.tagName,
        color: tag.tagColor,
        description: tag.tagDescription,
        createdAt: tag.createdAt
      }))
    })

  } catch (error) {
    console.error('Error in document tags GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getServerUser()

    const { id: documentId } = await params
    const body = await request.json()
    const { tagIds } = body

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json({ error: 'Tag IDs array is required' }, { status: 400 })
    }

    // Verify document ownership
    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (document.length === 0 || document[0].userId !== user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
    }

    // Verify all tags belong to user
    const userTags = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.userId, user.id),
        inArray(tags.id, tagIds)
      ))

    if (userTags.length !== tagIds.length) {
      return NextResponse.json({ error: 'Some tags not found or access denied' }, { status: 404 })
    }

    // Get existing document tags to avoid duplicates
    const existingTags = await db
      .select()
      .from(documentTags)
      .where(eq(documentTags.documentId, documentId))

    const existingTagIds = existingTags.map(dt => dt.tagId)
    const newTagIds = tagIds.filter(tagId => !existingTagIds.includes(tagId))

    // Add new document tags
    if (newTagIds.length > 0) {
      const newDocumentTags = newTagIds.map(tagId => ({
        id: nanoid(),
        documentId,
        tagId,
        createdAt: new Date()
      }))

      await db.insert(documentTags).values(newDocumentTags)
    }

    return NextResponse.json({ 
      message: `Added ${newTagIds.length} new tag${newTagIds.length !== 1 ? 's' : ''} to document`,
      addedCount: newTagIds.length
    })

  } catch (error) {
    console.error('Error in document tags POST API:', error)
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
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Verify document ownership
    const document = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (document.length === 0 || document[0].userId !== user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
    }

    // Verify tag belongs to user
    const tag = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.id, tagId),
        eq(tags.userId, user.id)
      ))
      .limit(1)

    if (tag.length === 0) {
      return NextResponse.json({ error: 'Tag not found or access denied' }, { status: 404 })
    }

    // Remove tag from document
    await db
      .delete(documentTags)
      .where(and(
        eq(documentTags.documentId, documentId),
        eq(documentTags.tagId, tagId)
      ))

    return NextResponse.json({ message: 'Tag removed from document successfully' })

  } catch (error) {
    console.error('Error in document tags DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}