# 🔒 Fix Supabase Storage RLS Policies

## Problem
Getting error: `Upload failed: new row violates row-level security policy`

This happens because Supabase Storage has Row Level Security (RLS) enabled but no policies are set up to allow uploads.

## Solution: Set Up Storage Policies

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **Storage** in the left sidebar
3. Click on your **"documents"** bucket

### Step 2: Configure Bucket Policies

**Option A: Quick Fix - Make Bucket Public (Temporary)**
1. In the Storage page, find your "documents" bucket
2. Click the **three dots (⋮)** next to the bucket name
3. Select **"Edit bucket"**
4. Check **"Public bucket"** ✅
5. Click **"Save"**

**Option B: Proper RLS Policies (Recommended)**

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Find the **storage.objects** table
3. Click **"New Policy"**
4. Create these policies:

**Policy 1: Upload Policy**
```sql
-- Policy Name: "Users can upload their own documents"
-- Table: storage.objects
-- Operation: INSERT
-- Policy Definition:
(bucket_id = 'documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

**Policy 2: Read Policy**
```sql
-- Policy Name: "Users can read their own documents" 
-- Table: storage.objects
-- Operation: SELECT
-- Policy Definition:
(bucket_id = 'documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

**Policy 3: Delete Policy**
```sql
-- Policy Name: "Users can delete their own documents"
-- Table: storage.objects  
-- Operation: DELETE
-- Policy Definition:
(bucket_id = 'documents'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

### Step 3: Alternative - SQL Commands

If the UI method doesn't work, you can run these SQL commands in the **SQL Editor**:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create upload policy
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create read policy  
CREATE POLICY "Users can read documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create delete policy
CREATE POLICY "Users can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Temporary Quick Fix

If you want to test uploads immediately, you can temporarily disable RLS:

### Go to SQL Editor and run:
```sql
-- TEMPORARY: Disable RLS for testing (NOT recommended for production)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** This makes your storage public. Only use for testing!

## Test the Fix

1. Try uploading your Receipt 1416.pdf again
2. If it works, you've fixed the RLS issue
3. If not, check the browser console for more specific errors

## Production Recommendations

For production, you should:
1. ✅ Enable proper RLS policies (Option B above)
2. ✅ Implement user authentication 
3. ✅ Use user-specific folder structures
4. ❌ Never disable RLS completely

---

**Next Steps:** Once you fix the RLS policies, try uploading again and let me know if you need help with user authentication integration!