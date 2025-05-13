// src/components/ui/file-uploader.tsx

'use client';

import React, { useState, useCallback, useEffect, ReactElement } from 'react';
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from 'uploadthing/client';
import { Accept, useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, FileIcon, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useUploadThing, uploadFiles } from '@/lib/cloud/uploadthing-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ASSET_TYPES, FILE_UPLOAD } from '@/constants';

interface FileUploaderProps {
  endpoint: 'assetUploader' | 'profileImage' | 'projectImage';
  value?: string | File;
  onChange: (file?: File | string) => void;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  fileType?: 'image' | 'audio' | 'video' | 'pdf' | 'model' | 'blob';
  maxSizeMB?: number;
  label?: string;
  description?: string;
  showRemoveButton?: boolean;
  disabled?: boolean;
  required?: boolean;
  autoUpload?: boolean;
}

const getAcceptType = (type: FileUploaderProps['fileType']): Accept | undefined => {
  switch (type) {
    case 'image':
      return { 'image/*': FILE_UPLOAD.ALLOWED_IMAGE_TYPES };
    case 'audio':
      return { 'audio/*': FILE_UPLOAD.ALLOWED_AUDIO_TYPES };
    case 'video':
      return { 'video/*': FILE_UPLOAD.ALLOWED_VIDEO_TYPES };
    case 'pdf':
      return { 'application/pdf': ['.pdf'] };
    case 'model':
      return { 'model/*': ['.obj', '.fbx', '.glb', '.gltf'] };
    case 'blob':
      return undefined; // Allow all
    default:
      return undefined;
  }
};

export interface FileUploaderHandle {
  triggerUpload: () => Promise<void>;
}

export const FileUploader = React.forwardRef<
  FileUploaderHandle,
  FileUploaderProps
>(function FileUploader(
  {
    endpoint,
    value,
    onChange,
    onUploadComplete,
    onUploadError,
    className,
    fileType = 'image',
    maxSizeMB,
    label = 'Upload file',
    description,
    showRemoveButton = true,
    disabled = false,
    required = false,
    autoUpload = false,
  },
  ref
): ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Get server configuration for file types
  const { routeConfig } = useUploadThing(endpoint);
  
  // Use server config if available, otherwise fall back to local accept types
  const accept = routeConfig
    ? generateClientDropzoneAccept(
        generatePermittedFileTypes(routeConfig).fileTypes
      )
    : getAcceptType(fileType);

  // Determine max file size based on file type or prop
  const getMaxSize = () => {
    if (maxSizeMB) return maxSizeMB * 1024 * 1024;
    
    switch (fileType) {
      case 'image': return FILE_UPLOAD.MAX_IMAGE_SIZE;
      case 'audio': return FILE_UPLOAD.MAX_AUDIO_SIZE;
      case 'video': return FILE_UPLOAD.MAX_VIDEO_SIZE;
      case 'model': return FILE_UPLOAD.MAX_MODEL_SIZE;
      case 'pdf': return FILE_UPLOAD.MAX_DOCUMENT_SIZE;
      default: return 10 * 1024 * 1024; // 10MB default
    }
  };

  const maxSize = getMaxSize();

  // Update preview when value changes
  useEffect(() => {
    if (value instanceof File) {
      setSelectedFile(value);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(value);
      setFileName(value.name);
    } else if (typeof value === 'string') {
      setPreview(value);
      setSelectedFile(null);
    }
  }, [value]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Handle file rejections
      if (fileRejections.length > 0) {
        const msg = fileRejections[0].errors[0].message;
        setUploadError(msg);
        setTimeout(() => setUploadError(null), 5000);
        return;
      }

      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      
      // Check file size
      if (file.size > maxSize) {
        setUploadError(`File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))} MB.`);
        setTimeout(() => setUploadError(null), 5000);
        return;
      }
      
      // Store the file
      setSelectedFile(file);
      setFileName(file.name);
      setUploadError(null);
      setUploadSuccess(false);
      
      // Create preview for images
      if (fileType === 'image' || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      
      // Notify parent component
      onChange(file);
      
      // If autoUpload is true, upload immediately (legacy behavior)
      if (autoUpload) {
        await uploadFile(file);
      }
    },
    [fileType, maxSize, onChange, autoUpload]
  );

  // Separate upload function that can be called manually
  const uploadFile = async (fileToUpload: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Start upload using uploadFiles
      const res = await uploadFiles(endpoint, {
        files: [fileToUpload],
        onUploadProgress: ({ progress }) => setUploadProgress(progress),
      });
      
      if (res && res[0]) {
        const uploadedFile = res[0];
        const url = uploadedFile.ufsUrl;
        
        onChange(url);
        setPreview(url);
        setFileName(uploadedFile.name);
        setUploadSuccess(true);
        setSelectedFile(null); // Clear the file since it's uploaded
        
        if (onUploadComplete) {
          onUploadComplete(url);
        }
        
        // Reset success message after a delay
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
      console.error('Upload error:', error);
      if (onUploadError) {
        onUploadError(error);
      }
      
      // Reset error message after a delay
      setTimeout(() => {
        setUploadError(null);
      }, 5000);
    } finally {
      setIsUploading(false);
    }
  };

  // Public method to trigger upload manually
  const triggerUpload = useCallback(async () => {
    if (selectedFile && !isUploading) {
      await uploadFile(selectedFile);
    }
  }, [selectedFile, isUploading]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize,
    disabled: disabled || isUploading,
  });

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    setSelectedFile(null);
    setUploadSuccess(false);
    setUploadError(null);
    onChange(undefined);
  };

  // Get friendly file size display
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get display text for file types
  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'image': return 'PNG, JPG, GIF, WebP';
      case 'audio': return 'MP3, WAV, OGG';
      case 'video': return 'MP4, WebM, MOV';
      case 'model': return '3D models (OBJ, FBX, GLB, GLTF)';
      case 'pdf': return 'PDF documents';
      default: return 'Files';
    }
  };

  // Get file type icon
  const getFileTypeIcon = () => {
    switch (fileType) {
      case 'audio':
        return (
          <div className="bg-gradient-to-br from-blue-400 to-purple-500 aspect-video w-full rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        );
      case 'video':
        return (
          <div className="bg-gradient-to-br from-red-400 to-orange-500 aspect-video w-full rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        );
      case 'model':
        return (
          <div className="bg-gradient-to-br from-green-400 to-teal-500 aspect-video w-full rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        );
      case 'pdf':
        return (
          <div className="bg-gradient-to-br from-red-500 to-pink-500 aspect-video w-full rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gradient-to-br from-gray-400 to-gray-600 aspect-video w-full rounded-lg flex items-center justify-center">
            <FileIcon className="h-16 w-16 text-white" />
          </div>
        );
    }
  };

  React.useImperativeHandle(ref, () => ({
    triggerUpload,
  }));

  // Expose uploadFile method to parent components
  useEffect(() => {
    // Attach the triggerUpload method to the component instance
    // This allows parent components to call it manually
    if (onChange && typeof onChange === 'function') {
      (onChange as any).triggerUpload = triggerUpload;
    }
  }, [onChange, triggerUpload]);

  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      {preview && fileType === 'image' ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={preview}
            alt="Uploaded file"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {showRemoveButton && !disabled && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          )}
          {fileName && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-2 text-xs truncate">
              {fileName}
            </div>
          )}
        </div>
      ) : preview && fileType !== 'image' ? (
        <div className="relative border rounded-lg p-4 flex items-center space-x-4">
          <div className="flex-shrink-0 w-16">
            {getFileTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName || 'File uploaded'}</p>
            <p className="text-xs text-muted-foreground">
              {fileType.toUpperCase()} • {selectedFile ? formatFileSize(selectedFile.size) : 'Uploaded'}
            </p>
          </div>
          {showRemoveButton && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      ) : selectedFile && !preview ? (
        <div className="relative border rounded-lg p-4 flex items-center space-x-4">
          <div className="flex-shrink-0 w-16">
            {getFileTypeIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {fileType.toUpperCase()} • {formatFileSize(selectedFile.size)} • Ready to upload
            </p>
          </div>
          {showRemoveButton && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragActive && !isDragReject ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25',
            isDragReject ? 'border-destructive/50 bg-destructive/5' : '',
            isUploading ? 'pointer-events-none opacity-60' : '',
            uploadError ? 'border-destructive/50' : '',
            uploadSuccess ? 'border-green-500/50' : '',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            className
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </>
            ) : uploadError ? (
              <>
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm text-destructive">{uploadError}</p>
                <p className="text-xs text-muted-foreground">Try again with a different file</p>
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <p className="text-sm text-green-500">File uploaded successfully!</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">Drag & drop your file here or browse</p>
                  <p className="text-sm text-muted-foreground">
                    {getFileTypeLabel()} up to {formatFileSize(maxSize)}
                  </p>
                </div>
                <Button variant="outline" className="mt-2" disabled={disabled}>
                  Select File
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      {uploadError && (
        <p className="text-sm text-destructive flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" /> {uploadError}
        </p>
      )}
    </div>
  );
});

FileUploader.displayName = 'FileUploader';