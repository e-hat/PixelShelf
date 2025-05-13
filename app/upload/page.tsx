// app/upload/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploader } from '@/components/ui/file-uploader';
import { Separator } from '@/components/ui/separator';
import { ASSET_TYPES, ASSET_TYPE_NAMES } from '@/constants';
import { api, ApiError } from '@/lib/api/api-client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  ImageIcon,
  FileAudio,
  FileVideo,
  Box,
  FileText,
  Loader2,
  FolderKanban,
  InfoIcon,
} from 'lucide-react';

const uploadInputSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  fileUrl: z.string().min(1, { message: 'Please upload a file' }),
  fileType: z.nativeEnum(ASSET_TYPES),
  projectId: z.string().optional(),
  isPublic: z.boolean(),
  tags: z.string().optional(),
});

// Form schema with validation
const uploadSchema = uploadInputSchema.transform((data) => ({
  ...data,
  tags: data.tags
    ? data.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    : [],
}));

type UploadFormValues = z.infer<typeof uploadInputSchema>;

function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<keyof typeof ASSET_TYPES>('IMAGE');
  
  // Get projectId from query params if present
  const projectIdParam = searchParams?.get('projectId') ?? undefined;

  // Initialize form with default values
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadInputSchema),
    defaultValues: {
      title: '',
      description: '',
      fileUrl: '',
      fileType: 'IMAGE',
      projectId: projectIdParam || undefined,
      isPublic: true,
      tags: '',
    },
  });

  // Load user's projects when session is available
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (status === 'authenticated' && session.user.id) {
          const response = await api.projects.getAll({ 
            userId: session.user.id,
            limit: 100
          });
          setProjects(response.projects);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchProjects();
    }
  }, [session, status]);

  // Handle file type change
  const handleFileTypeChange = (type: string) => {
    setSelectedFileType(type as keyof typeof ASSET_TYPES);
    form.setValue('fileType', type as keyof typeof ASSET_TYPES);
  };

  // Handle file upload
  const handleFileUpload = (url?: string) => {
    form.setValue('fileUrl', url ?? '');
  };

  // Handle form submission
  const onSubmit = async (data: UploadFormValues) => {
    try {
      setIsLoading(true);
      
      const assetData = {
        title: data.title,
        description: data.description || '',
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        projectId: data.projectId || undefined,
        isPublic: data.isPublic,
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
      
      const response = await api.assets.create(assetData);
      
      setUploadSuccess(true);
      toast.success('Asset uploaded successfully!');
      
      // Redirect to the asset page
      setTimeout(() => {
        router.push(`/assets/${response.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to upload asset');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
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

  // Get the icon for the selected file type
  const getFileTypeIcon = () => {
    switch (selectedFileType) {
      case 'IMAGE':
        return <ImageIcon className="h-5 w-5" />;
      case 'AUDIO':
        return <FileAudio className="h-5 w-5" />;
      case 'VIDEO':
        return <FileVideo className="h-5 w-5" />;
      case 'MODEL_3D':
        return <Box className="h-5 w-5" />;
      case 'DOCUMENT':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  // Get the file uploader type based on selected file type
  const getUploaderType = () => {
    switch (selectedFileType) {
      case 'IMAGE':
        return 'image';
      case 'AUDIO':
        return 'audio';
      case 'VIDEO':
        return 'video';
      case 'MODEL_3D':
        return 'model';
      case 'DOCUMENT':
        return 'pdf';
      default:
        return 'blob';
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <div className="flex-shrink-0 bg-pixelshelf-light p-3 rounded-full mr-4">
          <Upload className="h-6 w-6 text-pixelshelf-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Upload Asset</h1>
          <p className="text-muted-foreground">
            Share your work with other game developers
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle>Select Asset Type</CardTitle>
          <CardDescription>
            Choose the type of asset you're uploading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(ASSET_TYPES).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                  selectedFileType === value
                    ? 'bg-pixelshelf-light border-pixelshelf-primary'
                    : 'hover:bg-muted/50 hover:border-muted-foreground/20'
                }`}
                onClick={() => handleFileTypeChange(value)}
              >
                {value === 'IMAGE' && <ImageIcon className="h-8 w-8 mb-2" />}
                {value === 'AUDIO' && <FileAudio className="h-8 w-8 mb-2" />}
                {value === 'VIDEO' && <FileVideo className="h-8 w-8 mb-2" />}
                {value === 'MODEL_3D' && <Box className="h-8 w-8 mb-2" />}
                {value === 'DOCUMENT' && <FileText className="h-8 w-8 mb-2" />}
                {value === 'OTHER' && <File className="h-8 w-8 mb-2" />}
                <span className="text-sm font-medium">{ASSET_TYPE_NAMES[value]}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload your {ASSET_TYPE_NAMES[selectedFileType].toLowerCase()} file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUploader
                        endpoint="assetUploader"
                        value={field.value}
                        onChange={handleFileUpload}
                        label={`Upload ${ASSET_TYPE_NAMES[selectedFileType]}`}
                        description={`Select or drag and drop your ${ASSET_TYPE_NAMES[selectedFileType].toLowerCase()} file`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                Provide information about your asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter a title for your ${ASSET_TYPE_NAMES[selectedFileType].toLowerCase()}`}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A clear, descriptive title helps others find your work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your asset, its features, and how it can be used"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about your asset, including tools used and special features
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="pixel-art, character, environment (comma-separated)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add relevant tags to help others discover your work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value === 'none' ? undefined : value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not part of a project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Organize your asset by adding it to a project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Make this asset public</FormLabel>
                      <FormDescription>
                        Public assets are visible to everyone. Private assets are only visible to you.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                variant="pixel"
                disabled={isLoading || form.formState.isSubmitting || uploadSuccess}
                className="min-w-[150px]"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : uploadSuccess ? (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4" />
                    Uploaded!
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Asset
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading URL parameters...</div>}>
      <UploadPageContent />
    </Suspense>
  )
}

// Extra icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const File = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);