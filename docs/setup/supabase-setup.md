# 🚀 Supabase Setup Guide for Filyx.ai

## Complete Supabase Configuration (Database + Auth + Storage)

Since you chose Option B, we'll use Supabase for everything - database, authentication, and file storage. This is the easiest approach!

## Step 1: Create Supabase Project

1. **Go to Supabase:**
   - Visit: https://supabase.com
   - Click "Start your project" or "New Project"
   - Sign in with GitHub or create account

2. **Create New Project:**
   - Organization: Choose your personal organization
   - Project Name: `filyx-ai` (or any name you prefer)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose closest to your location
   - Click "Create new project"
   - Wait 2-3 minutes for project setup

## Step 2: Get Your Database Connection

1. **Navigate to Database Settings:**
   - Go to Settings (gear icon) → Database
   - Scroll down to "Connection string"

2. **Copy the Connection String:**
   - Select "Nodejs" tab
   - Copy the connection string (looks like):
   ```
   postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
   - Replace `[password]` with your actual database password

3. **Update .env.local:**
   Replace the DATABASE_URL in your `.env.local` file

## Step 3: Get API Keys

1. **Go to API Settings:**
   - Settings → API

2. **Copy These Values:**
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Long string starting with `eyJ...`

3. **Update .env.local:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

## Step 4: Create Storage Bucket

1. **Go to Storage:**
   - Click "Storage" in left sidebar
   - Click "New bucket"

2. **Create Documents Bucket:**
   - Bucket name: `documents`
   - Public bucket: ✅ (checked)
   - Click "Create bucket"

3. **Set Storage Policies (Optional - for security):**
   - We'll configure RLS policies later for secure access

## Step 5: Get OpenAI API Key

1. **Create OpenAI Account:**
   - Visit: https://platform.openai.com
   - Sign up or sign in

2. **Add Billing:**
   - Go to Billing → Add payment method
   - Add at least $5-10 credit

3. **Generate API Key:**
   - Go to API keys → Create new secret key
   - Name: "Filyx AI Development"
   - Copy the key (starts with `sk-...`)

4. **Update .env.local:**
   ```env
   OPENAI_API_KEY="sk-your-key-here"
   ```

## Step 6: Generate Auth Secret

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and update NEXTAUTH_SECRET in `.env.local`

## Step 7: Complete .env.local File

Your final `.env.local` should look like this:

```env
# Database Configuration (Using Supabase Database)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-key-here"

# Application Configuration
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

## Step 8: Test Your Setup

Once you've configured everything, test it:

### 1. Run Database Migration
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

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Migration runs without errors
- ✅ System categories are seeded
- ✅ Dev server starts at http://localhost:3000
- ✅ No database connection errors in console

## 🚨 Common Issues

**Migration fails?**
- Check your DATABASE_URL format
- Ensure password has no special characters that need URL encoding
- Verify you're using the "Nodejs" connection string

**API key errors?**
- Make sure keys don't have extra spaces
- Verify Supabase project is fully initialized (wait 3-5 minutes after creation)

**Storage issues?**
- Ensure the "documents" bucket is created and public
- Check bucket name spelling

---

**Ready?** Once you complete these steps, we can immediately start implementing the document upload system! 🚀