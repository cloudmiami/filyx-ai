# Strategic Database Planning Document

## App Summary

**End Goal:** Help professionals and business owners save countless hours through AI-powered document organization and classification  
**Template Used:** rag-saas (complete schema replacement from chat-saas)  
**Core Features:** Automated document classification, intelligent search, RAG-powered Q&A, subscription tiers

---

## 🗄️ Database Architecture Strategy

### Implementation Timeline

**Phase 1 (MVP Launch - Weeks 1-2):**
- Core document management (documents, categories, classifications)
- User authentication with document-based usage tracking
- Basic search functionality with PostgreSQL full-text search
- Standard business categories pre-populated

**Phase 2 (RAG Integration - Weeks 3-4):**
- PostgreSQL pgvector extension for embeddings
- RAG Q&A system with document citations
- Advanced semantic search capabilities
- Vector-based document similarity

**Phase 3 (Advanced Features - Weeks 5-6):**
- Search analytics and query optimization
- Advanced category management
- Bulk operations and document workflows
- Performance optimization and indexing

---

## 🏗️ Complete Database Schema

### Core Document Management Tables

```sql
-- Documents: Central table for all uploaded files
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File Information
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_hash TEXT UNIQUE NOT NULL, -- Prevent duplicates
    
    -- Processing Status
    processing_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'review_needed')),
    classification_confidence DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Classification Results
    primary_category_id UUID REFERENCES document_categories(id),
    secondary_categories UUID[], -- Array of category IDs
    extracted_text TEXT, -- OCR/extraction results
    ai_summary TEXT, -- Brief AI-generated summary
    
    -- Metadata
    extracted_metadata JSONB, -- Flexible storage for file-specific data
    tags TEXT[], -- User and AI-generated tags
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    classified_at TIMESTAMP WITH TIME ZONE,
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(original_filename, '') || ' ' ||
            COALESCE(extracted_text, '') || ' ' ||
            COALESCE(ai_summary, '')
        )
    ) STORED
);

-- Document Categories: Smart folders and classification system
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system categories
    
    -- Category Information
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Icon identifier for UI
    color TEXT, -- Hex color for UI theming
    
    -- Category Type
    category_type TEXT NOT NULL DEFAULT 'user_custom'
        CHECK (category_type IN ('system', 'ai_generated', 'user_custom')),
    
    -- Hierarchy Support
    parent_category_id UUID REFERENCES document_categories(id),
    sort_order INTEGER DEFAULT 0,
    
    -- Auto-Classification Rules
    classification_rules JSONB, -- AI classification patterns
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    document_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Classifications: AI classification results with confidence tracking
CREATE TABLE document_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES document_categories(id) ON DELETE CASCADE,
    
    -- Classification Details
    confidence_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    classification_method TEXT NOT NULL 
        CHECK (classification_method IN ('ai_auto', 'user_manual', 'user_review', 'bulk_action')),
    
    -- AI Model Information
    ai_model_used TEXT, -- e.g., 'gpt-4', 'claude-3'
    processing_metadata JSONB, -- Model-specific data
    
    -- Review Status
    review_status TEXT DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_review')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(document_id, category_id) -- Prevent duplicate classifications
);
```

### RAG & Vector Search Tables

```sql
-- Document Embeddings: Vector storage for semantic search and RAG
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- Vector Data
    embedding_vector vector(1536), -- OpenAI ada-002 dimensions
    chunk_text TEXT NOT NULL, -- Text chunk that generated this embedding
    chunk_index INTEGER NOT NULL, -- Position in document
    chunk_metadata JSONB, -- Page numbers, section headers, etc.
    
    -- Embedding Generation
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    token_count INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(document_id, chunk_index)
);

-- QA Conversations: Document Q&A chat sessions
CREATE TABLE qa_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conversation Context
    title TEXT, -- Auto-generated or user-set
    document_scope UUID[], -- Array of document IDs in scope
    category_scope UUID[], -- Array of category IDs in scope
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    message_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QA Messages: Individual Q&A exchanges
CREATE TABLE qa_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES qa_conversations(id) ON DELETE CASCADE,
    
    -- Message Content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    -- RAG Context (for assistant messages)
    source_documents UUID[], -- Documents referenced in response
    source_chunks JSONB[], -- Specific text chunks cited
    confidence_score DECIMAL(3,2), -- RAG retrieval confidence
    
    -- AI Model Information
    ai_model_used TEXT, -- e.g., 'gpt-4', 'claude-3'
    processing_metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Search & Analytics Tables

```sql
-- Search History: Track user search patterns
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Query Information
    query_text TEXT NOT NULL,
    query_type TEXT NOT NULL DEFAULT 'natural_language'
        CHECK (query_type IN ('natural_language', 'keyword', 'advanced_filter')),
    
    -- Search Results
    results_count INTEGER NOT NULL DEFAULT 0,
    result_document_ids UUID[], -- Documents returned
    
    -- Performance Metrics
    response_time_ms INTEGER,
    search_method TEXT, -- 'fulltext', 'vector', 'hybrid'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Usage Events: Track usage for subscription tiers
CREATE TABLE user_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type TEXT NOT NULL 
        CHECK (event_type IN ('document_upload', 'document_classification', 'qa_query', 'search_query')),
    event_metadata JSONB,
    
    -- Resource Consumption
    storage_bytes BIGINT, -- For upload events
    processing_tokens INTEGER, -- For AI operations
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Management (Enhanced)

```sql
-- Enhanced User Table (modify existing)
-- Add document-specific fields to existing users table:
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_upload_at TIMESTAMP WITH TIME ZONE;

-- Update subscription tiers enum for Filyx.ai pricing
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check 
    CHECK (subscription_tier IN ('free', 'professional', 'business'));
```

---

## 📊 Pre-Populated Categories

```sql
-- System categories for business professionals
INSERT INTO document_categories (name, description, category_type, icon, color) VALUES
('Invoices', 'Business invoices and billing documents', 'system', 'receipt', '#3B6AC7'),
('Contracts', 'Legal agreements and contracts', 'system', 'document-text', '#3EA65C'),
('Receipts', 'Purchase receipts and expense documentation', 'system', 'shopping-cart', '#E69B28'),
('Correspondence', 'Email, letters, and communication records', 'system', 'mail', '#3B6AC7'),
('Financial Reports', 'Financial statements and reports', 'system', 'chart-line', '#3EA65C'),
('Legal Documents', 'Legal paperwork and compliance documents', 'system', 'balance-scale', '#E69B28'),
('Marketing Materials', 'Brochures, presentations, and marketing content', 'system', 'bullhorn', '#3B6AC7'),
('HR Documents', 'Employee records and HR paperwork', 'system', 'users', '#3EA65C'),
('Tax Documents', 'Tax returns, forms, and related paperwork', 'system', 'calculator', '#E69B28'),
('Insurance', 'Insurance policies and claims', 'system', 'shield-alt', '#3B6AC7');
```

---

## ⚡ Performance Optimization

### Critical Indexes

```sql
-- Document management indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE INDEX idx_documents_category ON documents(primary_category_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_search ON documents USING gin(search_vector);

-- Vector similarity search (requires pgvector extension)
CREATE INDEX idx_embeddings_vector ON document_embeddings USING ivfflat (embedding_vector vector_cosine_ops);

-- RAG system indexes
CREATE INDEX idx_qa_messages_conversation ON qa_messages(conversation_id);
CREATE INDEX idx_qa_conversations_user ON qa_conversations(user_id);

-- Usage tracking indexes
CREATE INDEX idx_usage_events_user_type ON user_usage_events(user_id, event_type);
CREATE INDEX idx_usage_events_created ON user_usage_events(created_at DESC);

-- Category management indexes
CREATE INDEX idx_categories_user_type ON document_categories(user_id, category_type);
CREATE INDEX idx_classifications_document ON document_classifications(document_id);
```

---

## 🎯 Feature-to-Schema Mapping

### Ready to Build Features

- **Document Upload & Processing** → Uses `documents` table with processing status tracking
- **AI Classification** → Uses `document_classifications` with confidence scoring
- **Smart Categories** → Uses `document_categories` with system and custom types
- **Intelligent Search** → Uses full-text search + vector embeddings for hybrid approach
- **Document Q&A** → Uses `qa_conversations` + `qa_messages` with RAG citation system
- **Subscription Management** → Enhanced `users` table with document-based usage limits
- **Usage Analytics** → Uses `user_usage_events` and `search_queries` for insights

### Database Strategy Summary

Your **Filyx.ai** database architecture is designed for:
- **Scalability**: PostgreSQL with vector extensions supports millions of documents
- **Performance**: Strategic indexing for sub-second search and retrieval
- **Flexibility**: JSONB fields for evolving metadata and AI model outputs
- **Revenue Model**: Built-in usage tracking for subscription tier enforcement
- **AI-First Design**: Native support for embeddings, classifications, and RAG workflows

**Ready for development** with complete schema supporting all planned features from MVP through advanced functionality.
