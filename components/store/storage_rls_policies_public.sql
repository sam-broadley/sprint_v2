-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public uploads to user-uploads bucket (for testing)
CREATE POLICY "Allow public uploads to user-uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads'
);

-- Policy to allow public read access to user-uploads bucket
CREATE POLICY "Allow public read access to user-uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads'
);

-- Policy to allow public updates to user-uploads bucket
CREATE POLICY "Allow public updates to user-uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads'
);

-- Policy to allow public deletes from user-uploads bucket
CREATE POLICY "Allow public deletes from user-uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads'
);
