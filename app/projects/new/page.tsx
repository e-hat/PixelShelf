'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FolderKanban, 
  Upload, 
  X, 
  ImageIcon, 
  Loader2 
} from 'lucide-react';

const projectSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      isPublic: false,
    },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (limit to 5MB for MVP)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check file type (images only)
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files are allowed for the thumbnail');
      return;
    }

    setThumbnail(selectedFile);

    // Create thumbnail preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
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
    
    // Check file type (images only)
    if (!droppedFile.type.startsWith('image/')) {
      toast.error('Only image files are allowed for the thumbnail');
      return;
    }
    
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

  const clearThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setIsCreating(true);

    // In a real app, this would upload the thumbnail to storage and save project data to the database
    // For the MVP, we'll simulate a successful project creation after a short delay
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock project data that would normally come from the API
      const mockProjectData = {
        id: Math.random().toString(36).substring(2, 9),
        title: data.title,
        description: data.description || '',
        thumbnailUrl: thumbnail ? URL.createObjectURL(thumbnail) : null, // In real app, this would be the URL from storage
        userId: session?.user?.id || '',
        isPublic: data.isPublic,
        createdAt: new Date(),
      };

      toast.success('Project created successfully!');
      
      // Redirect to the user's profile
      router.push(`/u/${session?.user?.name}`);
    } catch (error) {
      console.error('Project creation error:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <FolderKanban className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to create projects</h1>
          <p className="text-muted-foreground">
            You need to sign in to create and manage projects.
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
      <h1 className="text-3xl font-bold mb-8">Create New Project</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Project details */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Project Title <span className="text-destructive">*</span>
            </label>
            <Input 
              id="title" 
              {...register('title')} 
              placeholder="What's your project called?" 
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
              placeholder="Tell us about your project (optional)" 
              rows={4}
            />
          </div>

          {/* Thumbnail upload */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Thumbnail (optional)
            </label>
            <div className="mt-1">
              {!thumbnailPreview ? (
                <div 
                  className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-muted rounded-full">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Add a cover image for your project</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      Upload Image
                    </Button>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleThumbnailChange}
                    accept="image/*"
                  />
                </div>
              ) : (
                <div className="relative aspect-video max-w-md w-full overflow-hidden rounded-md bg-muted">
                  <Image 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    fill 
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                  />
                  <button 
                    type="button"
                    onClick={clearThumbnail}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              {...register('isPublic')}
              className="h-4 w-4 rounded border-gray-300 text-pixelshelf-primary focus:ring-pixelshelf-primary"
            />
            <label htmlFor="isPublic" className="text-sm font-medium">
              Make this project public (visible to others)
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="pixel"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}