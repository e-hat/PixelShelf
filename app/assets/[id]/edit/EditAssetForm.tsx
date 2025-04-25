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
  Form, FormControl, FormDescription,
  FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { api, ApiError } from '@/lib/api/api-client';

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z.string().optional(),
  projectId: z.string().nullable().optional(),
  isPublic: z.boolean(),
  tags: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface EditAssetFormProps {
  assetId: string;
}

export default function EditAssetForm({ assetId }: EditAssetFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    (async () => {
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }
      if (status === 'loading') return;

      try {
        const assetData = await api.assets.getById(assetId);
        setAsset(assetData);

        if (session?.user?.id !== assetData.userId) {
          toast.error('You do not have permission to edit this asset');
          router.push(`/assets/${assetId}`);
          return;
        }

        form.reset({
          title: assetData.title,
          description: assetData.description || '',
          projectId: assetData.projectId,
          isPublic: assetData.isPublic,
          tags: assetData.tags.join(', '),
        });

        if (!session || !session.user?.id) {
          toast.error('Session is invalid');
          router.push('/login');
          return;
        }
        
        const projectsResponse = await api.projects.getAll({ userId: session.user.id });        
        setProjects(projectsResponse.projects);
      } catch (error) {
        console.error(error);
        if (error instanceof ApiError && error.status === 404) {
          toast.error('Asset not found');
          router.push('/');
        } else {
          toast.error('Failed to load asset details');
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [assetId, router, session, status, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const tags = values.tags
        ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      await api.assets.update(assetId, {
        title: values.title,
        description: values.description,
        projectId: values.projectId,
        isPublic: values.isPublic,
        tags,
      });

      toast.success('Asset updated successfully');
      router.push(`/assets/${assetId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
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
          {/* … your existing FormField components … */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push(`/assets/${assetId}`)}>
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
