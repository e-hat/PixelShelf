'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { api, ApiError } from '@/lib/api/api-client';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }),
  description: z.string().optional(),
  projectId: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditAssetPageProps {
  params: {
    id: string;
  };
}

export default function EditAssetPage({ params }: EditAssetPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form
  const formSchema = z.object({
    title: z.string().min(3, {
      message: 'Title must be at least 3 characters.',
    }),
    description: z.string().optional(),
    projectId: z.string().nullable().optional(),
    isPublic: z.boolean(), // Remove `.default(true)`
    tags: z.string().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: null,
      isPublic: true,
      tags: '',
    },
  });
  
  // Fetch asset data
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        // Check authentication
        if (status === 'unauthenticated') {
          router.push('/login');
          return;
        }
        
        if (status === 'loading') {
          return;
        }
        
        // Fetch asset
        const assetData = await api.assets.getById(params.id);
        setAsset(assetData);
        
        // Check ownership
        if (session?.user?.id !== assetData.userId) {
          toast.error('You do not have permission to edit this asset');
          router.push(`/assets/${params.id}`);
          return;
        }
        
        // Set form values
        form.reset({
          title: assetData.title,
          description: assetData.description || '',
          projectId: assetData.projectId,
          isPublic: assetData.isPublic,
          tags: assetData.tags.join(', '),
        });
        
        // Fetch user's projects
        if (session?.user?.id) {
          const projectsResponse = await api.projects.getAll({ userId: session.user.id });
          setProjects(projectsResponse.projects);
        }
      } catch (error) {
        console.error('Error fetching asset:', error);
        if (error instanceof ApiError && error.status === 404) {
          toast.error('Asset not found');
          router.push('/');
        } else {
          toast.error('Failed to load asset details');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAsset();
  }, [params.id, router, session, status, form]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Convert tags string to array
      const tags = values.tags
        ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      // Update asset
      await api.assets.update(params.id, {
        title: values.title,
        description: values.description,
        projectId: values.projectId,
        isPublic: values.isPublic,
        tags,
      });
      
      toast.success('Asset updated successfully');
      router.push(`/assets/${params.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to update asset');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (!asset) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Asset not found</h1>
          <p className="text-muted-foreground mb-8">
            The asset you are looking for could not be found.
          </p>
          <Button onClick={() => router.push('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Asset</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter asset title" {...field} />
                </FormControl>
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
                    placeholder="Describe your asset (optional)"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : e.target.value;
                      field.onChange(value);
                    }}
                  >
                    <option value="">Not part of a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormDescription>
                  Select a project to organize your assets
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
                  Separate tags with commas to help others discover your work
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
                    Public assets appear in feeds and search results. Private assets are only visible to you.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/assets/${params.id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}