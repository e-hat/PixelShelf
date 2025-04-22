'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Music, 
  FileVideo, 
  File3d, 
  FileText, 
  Loader2,
  FolderKanban 
} from 'lucide-react';
import { getAssetTypeFromUrl } from '@/lib/utils';

// Mock project data for MVP
const MOCK_PROJECTS = [
  { id: '1', title: 'Woodland Warriors' },
  { id: '2', title: 'Cosmic Drifter' },
];

const uploadSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  projectId: z.string().optional(),
  tags: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      isPublic: true,
    },
  });

  // In a real app, this would handle the actual file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (limit to 10MB for MVP)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);

    // Determine file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const audioExtensions = ['mp3', 'wav', 'ogg'];
    const videoExtensions = ['mp4', 'webm', 'mov'];
    const model3dExtensions = ['obj', 'fbx', 'glb', 'gltf'];
    
    if (imageExtensions.includes(fileExtension)) {
      setFileType('IMAGE');
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (audioExtensions.includes(fileExtension)) {
      setFileType('AUDIO');
      setFilePreview(null);
    } else if (videoExtensions.includes(fileExtension)) {
      setFileType('VIDEO');
      setFilePreview(null);
    } else if (model3dExtensions.includes(fileExtension)) {
      setFileType('MODEL_3D');
      setFilePreview(null);
    } else {
      setFileType('DOCUMENT');
      setFilePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    // Update the file input to reflect the dropped file
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      fileInputRef.current.files = dataTransfer.files;
      
      // Trigger file change handler
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFilePreview = () => {
    if (!fileType) return null;

    switch (fileType) {
      case 'IMAGE':
        return filePreview ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
            <Image 
              src={filePreview} 
              alt="Preview" 
              fill 
              className="object-contain" 
            />
            <button 
              onClick={clearFile}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null;
      case 'AUDIO':
        return (
          <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md relative">
            <Music className="h-16 w-16 text-muted-foreground" />
            <div className="absolute top-2 right-2">
              <button 
                onClick={clearFile}
                className="bg-background/80 backdrop-blur-sm p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md relative">
            <FileVideo className="h-16 w-16 text-muted-foreground" />
            <div className="absolute top-2 right-2">
              <button 
                onClick={clearFile}
                className="bg-background/80 backdrop-blur-sm p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      case 'MODEL_3D':
        return (
          <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md relative">
            <File3d className="h-16 w-16 text-muted-foreground" />
            <div className="absolute top-2 right-2">
              <button 
                onClick={clearFile}
                className="bg-background/80 backdrop-blur-sm p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-md relative">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <div className="absolute top-2 right-2">
              <button 
                onClick={clearFile}
                className="bg-background/80 backdrop-blur-sm p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const onSubmit = async (data: UploadFormValues) => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    // In a real app, this would upload the file to storage and save metadata to the database
    // For the MVP, we'll simulate a successful upload after a short delay
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()) 
        : [];

      // Mock asset data that would normally come from the API
      const mockAssetData = {
        id: Math.random().toString(36).substring(2, 9),
        title: data.title,
        description: data.description || '',
        fileUrl: URL.createObjectURL(file), // In real app, this would be the URL from storage
        fileType: fileType,
        projectId: data.projectId || null,
        userId: session?.user?.id || '',
        isPublic: data.isPublic,
        tags: tags,
        createdAt: new Date(),
      };

      toast.success('Asset uploaded successfully!');
      
      // Redirect to the asset page
      router.push(`/assets/${mockAssetData.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload asset. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <Upload className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to upload assets</h1>
          <p className="text-muted-foreground">
            You need to sign in to upload your game development assets.
          </p>
          <Button variant="pixel" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Upload Asset</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* File upload area */}
        {!file ? (
          <div 
            className="border-2 border-dashed rounded-md p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">Drag & drop your file here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Support for images, audio, video, 3D models, and documents
                </p>
              </div>
              <Button type="button" variant="outline">
                Browse Files
              </Button>
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,audio/*,video/*,.obj,.fbx,.glb,.gltf,.pdf,.doc,.docx"
            />
          </div>
        ) : (
          renderFilePreview()
        )}

        {/* Asset details */}
        {file && (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title <span className="text-destructive">*</span>
              </label>
              <Input 
                id="title" 
                {...register('title')} 
                placeholder="Give your asset a name" 
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea 
                id="description" 
                {...register('description')} 
                placeholder="Describe your asset (optional)" 
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium mb-1">
                Project (optional)
              </label>
              <select 
                id="projectId"
                {...register('projectId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Not part of a project</option>
                {MOCK_PROJECTS.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">
                Tags (comma-separated)
              </label>
              <Input 
                id="tags" 
                {...register('tags')} 
                placeholder="pixel-art, characters, ui, etc." 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add relevant tags to help others discover your work
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                {...register('isPublic')}
                className="h-4 w-4 rounded border-gray-300 text-pixelshelf-primary focus:ring-pixelshelf-primary"
              />
              <label htmlFor="isPublic" className="text-sm font-medium">
                Make this asset public (visible in feeds and search)
              </label>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="pixel"
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Asset'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}