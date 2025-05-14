"use client";

import { use, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUploader } from "@/components/ui/file-uploader";
import { api, ApiError } from "@/lib/api/api-client";
import { useUploadThing } from "@/lib/cloud/uploadthing-client";

// Form schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  isPublic: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

// Tell TypeScript that Next will hand us a Promise for params
interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  // unwrap the promised params
  const { id } = use(params);

  const { data: session, status } = useSession();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Use the startUpload function from uploadthing
  const { startUpload } = useUploadThing('projectImage');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      isPublic: false,
    },
  });

  useEffect(() => {
    // because this is a client component, we can still do side-effects
    async function fetchProject() {
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }
      if (status === "loading") {
        return;
      }

      try {
        const projectData = await api.projects.getById(id);
        setProject(projectData);

        if (session?.user?.id !== projectData.userId) {
          toast.error("You do not have permission to edit this project");
          router.push(`/u/${projectData.user.username}/projects/${id}`);
          return;
        }

        form.reset({
          title: projectData.title,
          description: projectData.description ?? "",
          thumbnail: projectData.thumbnail ?? "",
          isPublic: projectData.isPublic,
        });
      } catch (error) {
        console.error("Error fetching project:", error);
        if (error instanceof ApiError && error.status === 404) {
          toast.error("Project not found");
          router.push("/");
        } else {
          toast.error("Failed to load project details");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [id, router, session, status, form]);

  const handleThumbnailChange = (value?: File | string) => {
    if (value instanceof File) {
      setThumbnailFile(value);
      // Create preview URL
      const preview = URL.createObjectURL(value);
      form.setValue('thumbnail', preview);
    } else if (typeof value === 'string') {
      form.setValue('thumbnail', value);
      setThumbnailFile(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Upload thumbnail if there's a file to upload
      let thumbnailUrl = values.thumbnail;
      if (thumbnailFile) {
        const uploadResult = await startUpload([thumbnailFile]);
        if (uploadResult && uploadResult[0]) {
          thumbnailUrl = uploadResult[0].ufsUrl;
        }
      }
      
      await api.projects.update(id, {
        title: values.title,
        description: values.description,
        thumbnail: thumbnailUrl,
        isPublic: values.isPublic,
      });
      toast.success("Project updated successfully");
      router.push(
        session?.user?.username
          ? `/u/${session.user.username}/projects/${id}`
          : "/"
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update project"
      );
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

  if (!project) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <p className="text-muted-foreground mb-8">
            The project you are looking for could not be found.
          </p>
          <Button onClick={() => router.push("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Project</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your project (optional)"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* thumbnail */}
          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Thumbnail</FormLabel>
                <FormControl>
                  <FileUploader
                    endpoint="projectImage"
                    value={field.value}
                    onChange={handleThumbnailChange}
                    fileType="image"
                    autoUpload={false}
                  />
                </FormControl>
                <FormDescription>
                  Upload an image that represents your project
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* isPublic */}
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
                  <FormLabel>Make this project public</FormLabel>
                  <FormDescription>
                    Public projects appear in feeds and search results. Private
                    projects are only visible to you.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  session?.user?.username
                    ? `/u/${session.user.username}/projects/${id}`
                    : "/"
                )
              }
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
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}