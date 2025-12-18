import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents, documentClassifications, documentCategories } from '@/lib/schema'
import { eq, sql, and, gte } from 'drizzle-orm'
import { getServerUser } from '@/lib/supabase-server-temp'

export async function GET() {
  try {
    // Get authenticated user
    const user = await getServerUser()

    // Get date range for trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 1. Total document count
    const totalDocs = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.userId, user.id))

    // 2. Recent uploads (last 30 days)
    const recentUploads = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(
        and(
          eq(documents.userId, user.id),
          gte(documents.createdAt, thirtyDaysAgo)
        )
      )

    // 3. Total storage used
    const storageUsed = await db
      .select({ totalBytes: sql<number>`sum(${documents.sizeBytes})` })
      .from(documents)
      .where(eq(documents.userId, user.id))

    // 4. Processing status breakdown
    const statusBreakdown = await db
      .select({
        status: documents.processingStatus,
        count: sql<number>`count(*)`
      })
      .from(documents)
      .where(eq(documents.userId, user.id))
      .groupBy(documents.processingStatus)

    // 5. Category distribution
    const categoryDistribution = await db
      .select({
        categoryName: documentCategories.name,
        categoryColor: documentCategories.color,
        count: sql<number>`count(*)`
      })
      .from(documents)
      .leftJoin(documentClassifications, eq(documents.id, documentClassifications.documentId))
      .leftJoin(documentCategories, eq(documentClassifications.categoryId, documentCategories.id))
      .where(eq(documents.userId, user.id))
      .groupBy(documentCategories.name, documentCategories.color)

    // 6. Classification accuracy (documents with high confidence)
    const classificationStats = await db
      .select({
        averageConfidence: sql<number>`avg(cast(${documentClassifications.confidence} as decimal))`,
        highConfidenceCount: sql<number>`count(*) filter (where cast(${documentClassifications.confidence} as decimal) > 0.8)`,
        totalClassified: sql<number>`count(*)`
      })
      .from(documentClassifications)
      .leftJoin(documents, eq(documentClassifications.documentId, documents.id))
      .where(eq(documents.userId, user.id))

    // 7. Upload trends by day (last 30 days)
    const uploadTrends = await db
      .select({
        date: sql<string>`date(${documents.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(documents)
      .where(
        and(
          eq(documents.userId, user.id),
          gte(documents.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(${documents.createdAt})`)
      .orderBy(sql`date(${documents.createdAt})`)

    // 8. File type distribution
    const fileTypeDistribution = await db
      .select({
        mimeType: documents.mimeType,
        count: sql<number>`count(*)`
      })
      .from(documents)
      .where(eq(documents.userId, user.id))
      .groupBy(documents.mimeType)
      .orderBy(sql`count(*) desc`)

    return NextResponse.json({
      summary: {
        totalDocuments: Number(totalDocs[0]?.count || 0),
        recentUploads: Number(recentUploads[0]?.count || 0),
        totalStorageBytes: Number(storageUsed[0]?.totalBytes || 0),
        averageConfidence: Number(classificationStats[0]?.averageConfidence || 0),
        highConfidenceRate: classificationStats[0]?.totalClassified > 0 
          ? Number(classificationStats[0]?.highConfidenceCount || 0) / Number(classificationStats[0]?.totalClassified || 1)
          : 0
      },
      charts: {
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: Number(item.count)
        })),
        categoryDistribution: categoryDistribution
          .filter(item => item.categoryName) // Filter out null categories
          .map(item => ({
            category: item.categoryName,
            color: item.categoryColor,
            count: Number(item.count)
          })),
        uploadTrends: uploadTrends.map(item => ({
          date: item.date,
          count: Number(item.count)
        })),
        fileTypeDistribution: fileTypeDistribution.map(item => ({
          type: item.mimeType,
          count: Number(item.count)
        }))
      }
    })

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}