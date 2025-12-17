-- Drop existing restrictive policies for articles bucket
DROP POLICY IF EXISTS "Approved users can upload article images" ON storage.objects;

-- Create new permissive policy that directly checks the conditions
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'articles' 
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Also fix avatar policy to be more explicit
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Add delete policies for users to manage their own files
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own article images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'articles' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);