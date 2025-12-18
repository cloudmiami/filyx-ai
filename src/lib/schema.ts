import { pgTable, text, timestamp, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core'

// Subscription tier enum
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'professional', 'business'])

// Classification status enum  
export const classificationStatusEnum = pgEnum('classification_status', ['pending', 'completed', 'failed', 'needs_review'])

// Processing status enum
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed'])

// Users table - core user management
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free').notNull(),
  documentCount: integer('document_count').default(0).notNull(),
  storageUsedBytes: integer('storage_used_bytes').default(0).notNull(),
  lastUploadAt: timestamp('last_upload_at'),
})

// Document categories - both system and custom
export const documentCategories = pgTable('document_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B6AC7').notNull(), // Professional blue default
  icon: text('icon').default('folder').notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Documents - main document storage
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageUrl: text('storage_url').notNull(),
  processingStatus: processingStatusEnum('processing_status').default('pending').notNull(),
  // OCR and text extraction fields
  extractedText: text('extracted_text'), // Full text content from OCR/extraction
  ocrStatus: processingStatusEnum('ocr_status').default('pending'), // OCR processing status
  ocrCompletedAt: timestamp('ocr_completed_at'), // When OCR was completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Document classifications - AI categorization results
export const documentClassifications = pgTable('document_classifications', {
  id: text('id').primaryKey(),
  documentId: text('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  categoryId: text('category_id').references(() => documentCategories.id, { onDelete: 'cascade' }).notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(), // 0.00 to 1.00
  isManualOverride: boolean('is_manual_override').default(false).notNull(),
  classificationStatus: classificationStatusEnum('classification_status').default('pending').notNull(),
  aiReasoning: text('ai_reasoning'), // Why AI chose this category
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tags - user-defined tags for document organization
export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  color: text('color').default('#6B7280').notNull(), // Gray default
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Document tags - many-to-many relationship between documents and tags
export const documentTags = pgTable('document_tags', {
  id: text('id').primaryKey(),
  documentId: text('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  tagId: text('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// User usage events - track document operations
export const userUsageEvents = pgTable('user_usage_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(), // 'upload', 'classify', 'search', 'download'
  documentId: text('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  metadata: text('metadata'), // JSON string for additional event data
  createdAt: timestamp('created_at').defaultNow().notNull(),
})