-- Supabase Storage RLS Policies for Filyx.ai
-- IMPORTANT: You must run this in the SQL Editor with RLS DISABLED or as service_role
-- Alternative: Use the Storage UI to create policies instead of SQL

-- METHOD 1: Quick Fix - Temporarily disable RLS for setup (RECOMMENDED)
-- Run this first, then create the bucket via UI, then re-enable RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Create storage bucket via UI (easier than SQL)
-- Go to Storage > New Bucket > Name: "documents" > Public: UNCHECKED

-- 3. Re-enable RLS after bucket is created
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- METHOD 2: If you want to use SQL policies, run these AFTER bucket creation:
-- (Skip this section if using UI method below)

-- 3. Drop existing policies if they exist (cleanup)
-- DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can read documents" ON storage.objects;  
-- DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;

-- RECOMMENDED APPROACH: Use Supabase UI for Policies (Much Easier!)
-- Instead of SQL, do this in the Supabase Dashboard:

-- STEP 1: Go to Storage > Buckets > Create "documents" bucket (Private)
-- STEP 2: Go to Authentication > Policies > storage.objects
-- STEP 3: Create these 4 policies using the UI:

-- Policy 1: "Allow uploads to own folder"
-- Operation: INSERT
-- Policy: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 2: "Allow reading own files" 
-- Operation: SELECT
-- Policy: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 3: "Allow deleting own files"
-- Operation: DELETE  
-- Policy: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]

-- Policy 4: "Allow updating own files"
-- Operation: UPDATE
-- Policy: bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]

-- ALTERNATIVE: If you prefer SQL, uncomment these lines:
-- (Only run AFTER creating the bucket via UI first!)

-- CREATE POLICY "Users can upload documents" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'documents' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can read documents" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'documents' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete documents" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'documents' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can update documents" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'documents' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- 8. Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';