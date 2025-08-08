-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to user-uploads bucket
CREATE POLICY "Allow authenticated users to upload to user-uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update files in user-uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow public read access to user-uploads bucket
CREATE POLICY "Allow public read access to user-uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads'
);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete files in user-uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' 
  AND auth.role() = 'authenticated'
);
