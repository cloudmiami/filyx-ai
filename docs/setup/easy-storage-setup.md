# 🔧 Easy Fix: Supabase Storage Setup (UI Method)

## The Problem
You got error: `ERROR: 42501: must be owner of table objects`

This happens because the storage.objects table requires service_role permissions. **The UI method is much easier!**

## ✅ EASY SOLUTION: Use Supabase Dashboard UI

### Step 1: Create Storage Bucket
1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Click "Storage"** in the left sidebar
3. **Click "New bucket"**
4. **Settings:**
   - Bucket name: `documents`
   - Public bucket: **❌ UNCHECK** (Keep private)
   - Click **"Create bucket"**

### Step 2: Create RLS Policies via UI
1. **Go to "Authentication"** → **"Policies"** in left sidebar
2. **Find "storage.objects"** table (scroll down)
3. **Click "New Policy"** 

### Create 4 Policies:

#### Policy 1: Upload Policy
- **Policy Name**: `Allow users to upload documents`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING Expression**: Leave empty
- **WITH CHECK Expression**: 
  ```sql
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

#### Policy 2: Read Policy  
- **Policy Name**: `Allow users to read own documents`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING Expression**:
  ```sql
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

#### Policy 3: Delete Policy
- **Policy Name**: `Allow users to delete own documents`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING Expression**:
  ```sql
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

#### Policy 4: Update Policy
- **Policy Name**: `Allow users to update own documents`
- **Allowed Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING Expression**:
  ```sql
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

## 🚀 Quick Test Method (Temporary)

If you want to test uploads immediately without setting up policies:

1. **Go to SQL Editor**
2. **Run this single command**:
   ```sql
   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
   ```
3. **Create the bucket** via UI (Step 1 above)
4. **Test uploads** - they should work now!
5. **⚠️ IMPORTANT**: Re-enable security later:
   ```sql
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   ```

## 🎯 After Setup

Once you complete either method:
1. **Go to**: http://localhost:3000
2. **Sign up/Sign in**
3. **Try uploading a document**
4. **Success!** 🎉

## 💡 Why This Works

The UI method works because:
- Supabase UI has proper permissions to create policies
- No need to worry about service_role vs authenticated user
- Visual interface prevents syntax errors
- Built-in validation ensures policies work correctly

**Ready to continue?** This should take just 5-10 minutes using the UI method!