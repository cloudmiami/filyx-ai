import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tags } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getServerUser } from '@/lib/supabase-server-temp'

export async function GET() {
  try {
    // Get current user
    const user = await getServerUser()

    // Get all tags for the user
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, user.id))
      .orderBy(tags.name)

    return NextResponse.json({ tags: userTags })

  } catch (error) {
    console.error('Error in tags GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getServerUser()

    const body = await request.json()
    const { name, color = '#6B7280', description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    // Check if tag with same name already exists for user
    const existingTag = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.userId, user.id),
        eq(tags.name, name.trim())
      ))
      .limit(1)

    if (existingTag.length > 0) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 })
    }

    // Create new tag
    const tagId = nanoid()
    const newTag = {
      id: tagId,
      userId: user.id,
      name: name.trim(),
      color: color || '#6B7280',
      description: description?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.insert(tags).values(newTag)

    return NextResponse.json({ tag: newTag }, { status: 201 })

  } catch (error) {
    console.error('Error in tags POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user
    const user = await getServerUser()

    const body = await request.json()
    const { id, name, color, description } = body

    if (!id || !name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Tag ID and name are required' }, { status: 400 })
    }

    // Check if tag exists and belongs to user
    const existingTag = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.id, id),
        eq(tags.userId, user.id)
      ))
      .limit(1)

    if (existingTag.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Check if another tag with same name already exists for user
    const duplicateTag = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.userId, user.id),
        eq(tags.name, name.trim())
      ))
      .limit(1)

    if (duplicateTag.length > 0 && duplicateTag[0].id !== id) {
      return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 })
    }

    // Update tag
    const updatedTag = {
      name: name.trim(),
      color: color || existingTag[0].color,
      description: description?.trim() || null,
      updatedAt: new Date()
    }

    await db
      .update(tags)
      .set(updatedTag)
      .where(and(
        eq(tags.id, id),
        eq(tags.userId, user.id)
      ))

    return NextResponse.json({ 
      tag: { 
        ...existingTag[0], 
        ...updatedTag 
      } 
    })

  } catch (error) {
    console.error('Error in tags PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user
    const user = await getServerUser()

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Check if tag exists and belongs to user
    const existingTag = await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.id, tagId),
        eq(tags.userId, user.id)
      ))
      .limit(1)

    if (existingTag.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Delete tag (document_tags will be cascade deleted)
    await db
      .delete(tags)
      .where(and(
        eq(tags.id, tagId),
        eq(tags.userId, user.id)
      ))

    return NextResponse.json({ message: 'Tag deleted successfully' })

  } catch (error) {
    console.error('Error in tags DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}