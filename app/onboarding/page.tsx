'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Upload, 
  ChevronRight, 
  PenLine, 
  Loader2,
  Terminal,
  Gamepad2,
  PaintBucket,
  Music,
  Code
} from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormMessage 
} from '@/components/ui/form';
import { FileUploader, FileUploaderHandle } from '@/components/ui/file-uploader';

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be at most 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  bio: z.string().max(500, { message: 'Bio must be at most 500 characters' }).optional(),
  role: z.string().optional(),
  website: z.string().optional(),
  profileImage: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

// Define role options
const ROLES = [
  { id: 'game-developer', label: 'Game Developer', icon: Terminal, description: 'You create games and gameplay features' },
  { id: 'game-designer', label: 'Game Designer', icon: Gamepad2, description: 'You design game mechanics and systems' },
  { id: 'pixel-artist', label: 'Pixel Artist', icon: PaintBucket, description: 'You create pixel-based game art' },
  { id: 'sound-designer', label: 'Sound Designer', icon: Music, description: 'You create sound effects and music for games' },
  { id: 'programmer', label: 'Programmer', icon: Code, description: 'You write code for game functionality' },
  { id: 'writer', label: 'Writer', icon: PenLine, description: 'You create stories and dialogue for games' },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(1);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      username: session?.user?.username || '',
      bio: '',
      website: '',
      role: '',
    }
  });

  const fileUploaderRef = useRef<FileUploaderHandle>(null);

  // Pre-fill the form with user data if available
  useEffect(() => {
    if (session?.user?.name && !profileImagePreview && session.user.image) {
      setProfileImagePreview(session.user.image);
    }
  }, [session, profileImagePreview]);

  const handleProfileImageChange = (value?: File | string) => {
    if (value instanceof File) {
      setProfileImage(value);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(value);
    } else if (typeof value === 'string') {
      setProfileImagePreview(value);
      form.setValue('profileImage', value);
    }
  };

  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    form.setValue('role', roleId);
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Trigger upload if there's a file to upload
      let profileImageUrl = data.profileImage;
      if (fileUploaderRef.current && profileImage) {
        const uploadedUrl = await fileUploaderRef.current.triggerUpload();
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }
      
      // First update the user profile on the server
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          bio: data.bio || '',
          image: profileImageUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      
      // Update the session with the new data
      if (update) {
        await update({
          ...session,
          user: {
            ...session?.user,
            username: updatedUser.username,
            image: updatedUser.image || session?.user?.image,
          },
        });
      }

      toast.success('Profile set up successfully!');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set up profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 py-12">
      <div className="bg-background max-w-2xl w-full mx-4 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to PixelShelf!</h1>
          <p className="text-muted-foreground mt-2">Let's set up your profile in a few quick steps</p>
        </div>

        <div className="flex justify-between mb-8">
          <div className={`flex-1 border-t-4 ${stage >= 1 ? 'border-pixelshelf-primary' : 'border-muted'} pt-1`}>
            <div className="text-center text-xs font-medium">
              Profile Photo
            </div>
          </div>
          <div className={`flex-1 border-t-4 ${stage >= 2 ? 'border-pixelshelf-primary' : 'border-muted'} pt-1`}>
            <div className="text-center text-xs font-medium">
              Basic Info
            </div>
          </div>
          <div className={`flex-1 border-t-4 ${stage >= 3 ? 'border-pixelshelf-primary' : 'border-muted'} pt-1`}>
            <div className="text-center text-xs font-medium">
              Your Role
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Stage 1: Profile Photo */}
            {stage === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUploader
                            ref={fileUploaderRef}
                            endpoint="profileImage"
                            value={profileImagePreview}
                            onChange={handleProfileImageChange}
                            maxSizeMB={4}
                            label="Upload profile photo"
                            description="JPG, PNG or GIF. 4MB max."
                            className="max-w-md mx-auto"
                            autoUpload={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-center mt-8">
                  <Button 
                    type="button" 
                    onClick={() => setStage(2)} 
                    variant="pixel"
                    className="min-w-[150px]"
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can also skip and add a photo later
                  </p>
                </div>
              </div>
            )}

            {/* Stage 2: Basic Info */}
            {stage === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <label htmlFor="username" className="text-sm font-medium">
                            Username <span className="text-destructive">*</span>
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                              @
                            </span>
                            <FormControl>
                              <Input 
                                {...field}
                                id="username"
                                className="rounded-l-none"
                                placeholder="your_username"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            This will be your unique identifier on PixelShelf
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <label htmlFor="bio" className="text-sm font-medium">
                            Bio
                          </label>
                          <FormControl>
                            <Textarea 
                              {...field}
                              id="bio"
                              rows={4}
                              placeholder="Tell other game developers about yourself and your work..."
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <label htmlFor="website" className="text-sm font-medium">
                            Website (optional)
                          </label>
                          <FormControl>
                            <Input 
                              {...field}
                              id="website"
                              placeholder="example.com"
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    onClick={() => setStage(1)} 
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setStage(3)} 
                    variant="pixel"
                    disabled={!!form.formState.errors.username || !!form.formState.errors.bio}
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Stage 3: Role */}
            {stage === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">What best describes you?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ROLES.map((role) => (
                      <div 
                        key={role.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedRole === role.id 
                            ? 'bg-pixelshelf-light border-pixelshelf-primary' 
                            : 'hover:border-pixelshelf-light'
                        }`}
                        onClick={() => handleSelectRole(role.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${
                            selectedRole === role.id 
                              ? 'bg-pixelshelf-primary text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <role.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{role.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    onClick={() => setStage(2)} 
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    variant="pixel"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}