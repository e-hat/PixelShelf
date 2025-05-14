// src/components/ui/circular-profile-photo.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { User, Camera, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FILE_UPLOAD } from '@/constants';

interface CircularProfilePhotoProps {
  value?: string | File;
  onChange: (file?: File | string) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  currentImage?: string;
  placeholder?: string;
}

export const CircularProfilePhoto: React.FC<CircularProfilePhotoProps> = ({
  value,
  onChange,
  onRemove,
  size = 'lg',
  label,
  description,
  disabled = false,
  required = false,
  currentImage,
  placeholder = "Upload photo",
}) => {
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : currentImage || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(
    value instanceof File ? value : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sizeClasses = {
    sm: { container: 'h-20 w-20', icon: 'h-6 w-6', camera: 'h-4 w-4', button: 'h-6 w-6' },
    md: { container: 'h-32 w-32', icon: 'h-10 w-10', camera: 'h-5 w-5', button: 'h-8 w-8' },
    lg: { container: 'h-40 w-40', icon: 'h-12 w-12', camera: 'h-6 w-6', button: 'h-10 w-10' },
    xl: { container: 'h-48 w-48', icon: 'h-16 w-16', camera: 'h-8 w-8', button: 'h-12 w-12' },
  };

  const currentSize = sizeClasses[size];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Check file size
      if (file.size > FILE_UPLOAD.MAX_IMAGE_SIZE) {
        setUploadError(`File is too large. Maximum size is ${Math.round(FILE_UPLOAD.MAX_IMAGE_SIZE / (1024 * 1024))} MB.`);
        setTimeout(() => setUploadError(null), 5000);
        return;
      }

      // Store the file and create preview
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setUploadError(null);

      // Notify parent
      onChange(file);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': FILE_UPLOAD.ALLOWED_IMAGE_TYPES },
    maxFiles: 1,
    maxSize: FILE_UPLOAD.MAX_IMAGE_SIZE,
    disabled: disabled || isUploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setSelectedFile(null);
    setUploadError(null);
    onChange(undefined);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-full overflow-hidden border-2 border-dashed transition-all cursor-pointer',
          currentSize.container,
          isDragActive && !disabled ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50',
          uploadError ? 'border-destructive/50' : ''
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <Image
            src={preview}
            alt="Profile"
            fill
            className="object-cover"
            sizes="200px"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <User className={cn('text-muted-foreground', currentSize.icon)} />
          </div>
        )}

        {/* Overlay on hover */}
        <div className={cn(
          'absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity',
          disabled && 'hover:opacity-0'
        )}>
          <Camera className={cn('text-white', currentSize.camera)} />
        </div>

        {/* Remove button */}
        {preview && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className={cn(
              'absolute top-0 right-0 rounded-full shadow-md',
              currentSize.button
            )}
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {(description || uploadError) && (
        <div className="text-center">
          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{description || placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
};