'use client';

import { useState, useCallback } from 'react';
import { generateClientDropzoneAccept } from 'uploadthing/client';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useUploadThing } from '@/lib/cloud/uploadthing-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  endpoint: 'assetUploader' | 'profileImage' | 'projectImage';
  value?: string;
  onChange: (url?: string) => void;
  onUploadBegin?: () => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  fileType?: 'image' | 'audio' | 'video' | 'pdf' | 'model' | 'blob';
}

export function FileUploader({
  endpoint,
  value,
  onChange,
  onUploadBegin,
  onUploadError,
  className,
  fileType = 'image'
}: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, permittedFileInfo } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (res?.[0]?.fileUrl) {
        onChange(res[0].fileUrl);
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      console.error('Upload error:', error);
      if (onUploadError) onUploadError(error);
    },
  });

  const fileTypes = permittedFileInfo?.config?.[fileType] ?? null;
  const accept = fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      // Create preview for images
      if (fileType === 'image') {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      
      setIsUploading(true);
      if (onUploadBegin) onUploadBegin();
      
      return startUpload(acceptedFiles);
    },
    [fileType, startUpload, onUploadBegin]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });

  const handleRemove = () => {
    setPreview(null);
    onChange(undefined);
  };

  return (
    <div className={cn('w-full', className)}>
      {preview && fileType === 'image' ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={preview}
            alt="Uploaded file"
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border border-dashed p-6 transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                {fileType === 'image' ? (
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <File className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">Drag & drop your file here or browse</p>
                  <p className="text-sm text-muted-foreground">
                    {fileType === 'image' && 'PNG, JPG, GIF up to 8MB'}
                    {fileType === 'audio' && 'MP3, WAV up to 16MB'}
                    {fileType === 'video' && 'MP4, WEBM up to 64MB'}
                    {fileType === 'pdf' && 'PDF documents up to 4MB'}
                    {fileType === 'model' && '3D models (OBJ, FBX, etc.) up to 32MB'}
                    {fileType === 'blob' && 'Files up to 32MB'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}