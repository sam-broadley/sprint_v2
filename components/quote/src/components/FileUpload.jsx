import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon, FileIcon, XIcon } from 'lucide-react';
import { Button } from './ui/button';

const FileUpload = ({ onFilesChange, supabase, storeId, maxFiles = 5, maxSize = 10485760 }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file) => {
    // If no Supabase client, simulate file upload for demo
    if (!supabase) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        path: `demo-uploads/${file.name}`
      };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file);

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl.publicUrl,
      path: filePath
    };
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = acceptedFiles.map(uploadFile);
      const newFiles = await Promise.all(uploadPromises);
      
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [uploadedFiles, maxFiles, onFilesChange, supabase, storeId]);

  const removeFile = async (index) => {
    const fileToRemove = uploadedFiles[index];
    
    try {
      // Remove from storage (skip if demo mode)
      if (supabase && !fileToRemove.path.startsWith('demo-uploads/')) {
        await supabase.storage
          .from('user-uploads')
          .remove([fileToRemove.path]);
      }
      
      const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(updatedFiles);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
      'application/pdf': ['.pdf'],
      'application/*': ['.ai', '.eps', '.psd']
    },
    disabled: isUploading || uploadedFiles.length >= maxFiles
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${
          isUploading || uploadedFiles.length >= maxFiles
            ? 'cursor-not-allowed opacity-50'
            : ''
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-sm text-blue-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm text-gray-600">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
            <p className="text-xs text-gray-500">
              Images, PDFs, AI, EPS, PSD files supported
            </p>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="text-sm text-blue-600 text-center">
          Uploading files...
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <FileIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)}KB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;