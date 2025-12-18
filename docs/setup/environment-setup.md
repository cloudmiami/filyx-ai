# 🔧 Environment Setup Guide for Filyx.ai

## Step-by-Step Setup Instructions

### 1. Create Your Environment File

First, let's create your `.env.local` file:

```bash
# Copy the example file
cp .env.example .env.local
```

Or create it manually in VS Code with the following content:

### 2. Database Setup (PostgreSQL)

You have several options for PostgreSQL:

#### Option A: Local PostgreSQL (Recommended for development)
1. **Install PostgreSQL locally:**
   - Download from: https://www.postgresql.org/download/windows/
   - Or use Docker: `docker run --name filyx-postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres`

2. **Create database:**
   ```sql
   CREATE DATABASE filyx_ai;
   ```

3. **Set DATABASE_URL in .env.local:**
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/filyx_ai"
   ```

#### Option B: Supabase Database (Easier setup)
1. Go to https://supabase.com
2. Create new project
3. Get your database URL from Settings > Database
4. Add to .env.local

### 3. Supabase Setup (Authentication & File Storage)

1. **Create Supabase Project:**
   - Visit: https://supabase.com
   - Click "New Project"
   - Choose organization and fill project details
   - Wait for project to be ready (~2 minutes)

2. **Get API Keys:**
   - Go to Settings > API
   - Copy the following values:

   ```
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

3. **Create Storage Bucket:**
   - Go to Storage in Supabase dashboard
   - Create new bucket named "documents"
   - Make it public or set appropriate RLS policies

### 4. OpenAI API Setup

1. **Get OpenAI API Key:**
   - Visit: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with sk-...)

2. **Add to .env.local:**
   ```
   OPENAI_API_KEY="sk-your-openai-key-here"
   ```

### 5. Complete .env.local File Template

Here's your complete `.env.local` file template:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/filyx_ai"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-key-here"

# Application Configuration
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 6. Generate Secure Secrets

For NEXTAUTH_SECRET, generate a random string:
```bash
# Option 1: Use OpenSSL
openssl rand -base64 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## 🧪 Test Your Setup

Once you've configured your `.env.local`, test the setup:

### 1. Test Database Connection
```bash
npm run db:migrate
```

### 2. Seed System Categories
```bash
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```

## 🚨 Common Issues & Solutions

### Database Connection Issues
- **Error: "Connection refused"**
  - Make sure PostgreSQL is running
  - Check the port (default is 5432)
  - Verify username/password

### Supabase Issues
- **Error: "Invalid API key"**
  - Double-check you copied the right keys
  - Make sure there are no extra spaces
  - Verify the project URL is correct

### OpenAI Issues
- **Error: "Incorrect API key"**
  - Ensure your API key starts with "sk-"
  - Check you have credits in your OpenAI account
  - Verify the key isn't expired

## 📝 Next Steps

After successful setup:
1. ✅ Database migrated
2. ✅ System categories seeded
3. ✅ Development server running
4. 🚀 Ready to implement document upload system!

---

**Need Help?** If you encounter any issues, let me know which step is giving you trouble and I'll help you troubleshoot!