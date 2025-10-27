# 🗂️ Filyx.ai - AI-Powered Document Management Platform

An intelligent document organization and classification platform built with Next.js, featuring AI-powered categorization, advanced search capabilities, and comprehensive document analytics.

## ✨ Features

- **🤖 AI Document Classification** - Automatically categorize documents using OpenAI
- **🔍 Intelligent Search** - Full-text search with natural language capabilities  
- **� Enhanced PDF Viewer** - Interactive PDF preview with precise text selection
- **�📊 Analytics Dashboard** - Comprehensive document insights and metrics
- **🏷️ Smart Tagging System** - Custom tags with color coding and organization
- **📤 Bulk Operations** - Multi-document selection and batch processing
- **💾 Export Features** - CSV and JSON export for external analysis
- **🔐 Secure Storage** - Supabase integration with user authentication

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npm run db:migrate

# Seed system categories
npm run db:seed

# Start development server
npm run dev
```

## 📚 Documentation

### Setup Guides
- **[Getting Started](docs/getting-started.md)** - Complete setup walkthrough
- **[Environment Setup](docs/setup/environment-setup.md)** - Configure API keys and database
- **[Supabase Setup](docs/setup/supabase-setup.md)** - Authentication and storage configuration
- **[Fix Storage RLS](docs/setup/fix-storage-rls.md)** - Troubleshoot upload permissions

### Implementation Details
- **[Bulk Operations](docs/implementation/bulk-operations.md)** - Multi-document management
- **[Export Features](docs/implementation/export-implementation.md)** - Data export capabilities
- **[Search System](docs/implementation/search-implementation.md)** - Full-text search implementation
- **[PDF Viewer Enhancement](PDF-VIEWER-IMPLEMENTATION.md)** - Advanced PDF preview with precise text selection

### Planning & Architecture
- **[Development Roadmap](docs/planning/roadmap.md)** - 6-week development plan
- **[System Architecture](docs/planning/system_architecture.md)** - Technical architecture
- **[UI Wireframes](docs/planning/wireframe.md)** - Interface mockups

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL with Supabase
- **AI Integration**: OpenAI GPT-4 for document classification
- **Storage**: Supabase Storage for file management
- **Authentication**: Supabase Auth

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints
│   ├── dashboard/      # Main dashboard
│   ├── upload/         # Document upload
│   └── search/         # Search interface
├── components/         # React components
├── lib/               # Database & utilities
└── types/             # TypeScript definitions
```

## 📊 Current Status

✅ **Complete Features:**
- Document upload and processing
- AI-powered classification  
- Enhanced PDF viewer with precise text selection
- Analytics dashboard
- Search functionality
- Bulk operations
- Tag management
- Export capabilities

⚠️ **Setup Required:**
- Environment configuration
- Supabase RLS policies

## 🤝 Contributing

This is a private project. For questions or issues, please refer to the documentation in the `docs/` directory.

## 📄 License

Private project - All rights reserved.
