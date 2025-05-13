// app/settings/profile/page.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import SettingsLayout from '@/components/layout/settings-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User,
  Loader2,
  Twitter,
  Github,
  Linkedin,
  Globe,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { api, ApiError } from '@/lib/api/api-client';
import { FileUploader, FileUploaderHandle } from '@/components/ui/file-uploader';

// Define validation schema
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  bio: z.string().max(500, { message: 'Bio must be at most 500 characters' }).optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | undefined>(undefined);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | undefined>(undefined);
  
  // Refs for file uploaders
  const profileImageUploaderRef = useRef<FileUploaderHandle>(null);
  const bannerImageUploaderRef = useRef<FileUploaderHandle>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      username: '',
      bio: '',
      location: '',
      website: '',
      twitter: '',
      github: '',
      linkedin: '',
    },
  });
  
  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      
      try {
        // Initialize form with session data
        form.reset({
          name: session.user.name || '',
          username: session.user.username || '',
          bio: '', // We don't have bio in session
          location: '',
          website: '',
          twitter: '',
          github: '',
          linkedin: '',
        });
        
        // Set profile image from session
        if (session.user.image) {
          setProfileImagePreview(session.user.image);
        }
        
        // Try to fetch additional user data if needed
        try {
          if (session.user.username) {
            const userData = await api.users.getProfile(session.user.username);
            
            // Update form with full user data
            form.reset({
              name: userData.name || session.user.name || '',
              username: userData.username || session.user.username || '',
              bio: userData.bio || '',
              location: userData.location || '',
              website: userData.social?.website || '',
              twitter: userData.social?.twitter || '',
              github: userData.social?.github || '',
              linkedin: userData.social?.linkedin || '',
            });
            
            // Set banner image
            if (userData.bannerImage) {
              setBannerImagePreview(userData.bannerImage);
            }
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Don't set an error here, as we already have some data from the session
        }
        
        setError(null);
      } catch (err) {
        console.error('Error initializing profile form:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [session, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!session) {
      toast.error('You must be signed in to update your profile');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Trigger uploads if there are files to upload
      if (profileImageUploaderRef.current) {
        await profileImageUploaderRef.current.triggerUpload();
      }
      
      if (bannerImageUploaderRef.current) {
        await bannerImageUploaderRef.current.triggerUpload();
      }
      
      // Update user profile
      const profileData = {
        ...data,
        image: profileImagePreview,
        bannerImage: bannerImagePreview,
      };
      
      await api.users.updateProfile(profileData);
      
      // Update session with new user data
      if (update) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: data.name,
            username: data.username,
            image: profileImagePreview,
          },
        });
      }
      
      toast.success('Profile updated successfully!');
      router.refresh();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error instanceof ApiError ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to access settings</h1>
          <p className="text-muted-foreground">
            You need to sign in to view and update your profile settings.
          </p>
          <Button variant="pixel" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <SettingsLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SettingsLayout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <SettingsLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load profile</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and how others see you on PixelShelf.
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Name <span className="text-destructive">*</span>
                        </label>
                        <Input 
                          id="name" 
                          {...form.register('name')} 
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium">
                          Username <span className="text-destructive">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                            @
                          </span>
                          <Input 
                            id="username" 
                            {...form.register('username')} 
                            className="rounded-l-none"
                          />
                        </div>
                        {form.formState.errors.username && (
                          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </label>
                      <Textarea 
                        id="bio" 
                        {...form.register('bio')} 
                        rows={4}
                        placeholder="Tell other game developers about yourself and your work..."
                      />
                      {form.formState.errors.bio && (
                        <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Location
                      </label>
                      <Input 
                        id="location" 
                        {...form.register('location')} 
                        placeholder="e.g., San Francisco, CA"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Social Links</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="website" className="text-sm font-medium flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        Website
                      </label>
                      <Input 
                        id="website" 
                        {...form.register('website')} 
                        placeholder="example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="twitter" className="text-sm font-medium flex items-center">
                        <Twitter className="h-4 w-4 mr-1" />
                        Twitter
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                          @
                        </span>
                        <Input 
                          id="twitter" 
                          {...form.register('twitter')} 
                          className="rounded-l-none"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="github" className="text-sm font-medium flex items-center">
                        <Github className="h-4 w-4 mr-1" />
                        GitHub
                      </label>
                      <Input 
                        id="github" 
                        {...form.register('github')} 
                        placeholder="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="linkedin" className="text-sm font-medium flex items-center">
                        <Linkedin className="h-4 w-4 mr-1" />
                        LinkedIn
                      </label>
                      <Input 
                        id="linkedin" 
                        {...form.register('linkedin')} 
                        placeholder="username"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="pixel"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Profile Image</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This image will be displayed on your profile and in your posts.
                    </p>
                    
                    <FileUploader
                      ref={profileImageUploaderRef}
                      endpoint="profileImage"
                      value={profileImagePreview}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          setProfileImagePreview(value);
                        } else if (!value) {
                          setProfileImagePreview(undefined);
                        }
                      }}
                      onUploadComplete={(url) => {
                        setProfileImagePreview(url);
                      }}
                      maxSizeMB={2}
                      label=""
                      autoUpload={false}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Banner Image</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This image will appear at the top of your profile page.
                    </p>
                    
                    <FileUploader
                      ref={bannerImageUploaderRef}
                      endpoint="projectImage"
                      value={bannerImagePreview}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          setBannerImagePreview(value);
                        } else if (!value) {
                          setBannerImagePreview(undefined);
                        }
                      }}
                      onUploadComplete={(url) => {
                        setBannerImagePreview(url);
                      }}
                      maxSizeMB={5}
                      label=""
                      autoUpload={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="pixel"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}