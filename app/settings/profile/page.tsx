'use client';

import { useState, useRef } from 'react';
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
  Upload,
  X, 
  Loader2,
  Twitter,
  Github,
  Linkedin,
  Globe,
  MapPin,
  ImageIcon
} from 'lucide-react';

// Mock user data for the MVP
const MOCK_USER = {
  id: '1',
  username: 'pixelartist',
  name: 'Alex Johnson',
  bio: 'Indie game developer and pixel artist. Creating retro-style games with modern gameplay. Currently working on my forest platformer "Woodland Warriors".',
  image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  bannerImage: 'https://images.unsplash.com/photo-1616031037011-287c29dd8ea2',
  location: 'San Francisco, CA',
  email: 'alex@example.com',
  social: {
    twitter: 'pixelartist',
    github: 'pixeldev',
    website: 'pixelartist.dev',
    linkedin: 'alexjohnson',
  },
  subscriptionTier: 'FREE',
};

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
  const [user, setUser] = useState(MOCK_USER);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      bio: user.bio || '',
      location: user.location || '',
      website: user.social?.website || '',
      twitter: user.social?.twitter || '',
      github: user.social?.github || '',
      linkedin: user.social?.linkedin || '',
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (limit to 2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('Profile image must be less than 2MB');
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setProfileImage(selectedFile);

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Banner image must be less than 5MB');
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setBannerImage(selectedFile);

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const clearProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
  };

  const clearBannerImage = () => {
    setBannerImage(null);
    setBannerImagePreview(null);
    if (bannerImageInputRef.current) {
      bannerImageInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);

    // In a real app, this would upload the images to storage and update the user profile in the database
    // For the MVP, we'll simulate a successful update after a short delay
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update user state
      setUser({
        ...user,
        name: data.name,
        username: data.username,
        bio: data.bio || '',
        location: data.location || '',
        image: profileImagePreview || user.image,
        bannerImage: bannerImagePreview || user.bannerImage,
        social: {
          website: data.website || '',
          twitter: data.twitter || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
        },
      });

      // In a real app, we would also update the session
      if (update) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.name,
            image: profileImagePreview || user.image,
          },
        });
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                          {...register('name')} 
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
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
                            {...register('username')} 
                            className="rounded-l-none"
                          />
                        </div>
                        {errors.username && (
                          <p className="text-sm text-destructive">{errors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </label>
                      <Textarea 
                        id="bio" 
                        {...register('bio')} 
                        rows={4}
                        placeholder="Tell other game developers about yourself and your work..."
                      />
                      {errors.bio && (
                        <p className="text-sm text-destructive">{errors.bio.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Location
                      </label>
                      <Input 
                        id="location" 
                        {...register('location')} 
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
                        {...register('website')} 
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
                          {...register('twitter')} 
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
                        {...register('github')} 
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
                        {...register('linkedin')} 
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
                    
                    <div className="flex items-center space-x-4">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted">
                        {profileImagePreview ? (
                          <Image 
                            src={profileImagePreview} 
                            alt="Profile preview" 
                            fill 
                            className="object-cover" 
                          />
                        ) : user.image ? (
                          <Image 
                            src={user.image} 
                            alt={user.name} 
                            fill 
                            className="object-cover" 
                          />
                        ) : (
                          <User className="h-full w-full p-4 text-muted-foreground" />
                        )}
                        
                        {(profileImagePreview || user.image) && (
                          <button 
                            type="button"
                            onClick={clearProfileImage}
                            className="absolute bottom-0 right-0 rounded-full bg-background/80 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => profileImageInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Change image
                        </Button>
                        <input 
                          type="file" 
                          ref={profileImageInputRef} 
                          onChange={handleProfileImageChange} 
                          className="hidden" 
                          accept="image/*" 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG or GIF. 2MB max.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Banner Image</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This image will appear at the top of your profile page.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted">
                        {bannerImagePreview ? (
                          <Image 
                            src={bannerImagePreview} 
                            alt="Banner preview" 
                            fill 
                            className="object-cover" 
                          />
                        ) : user.bannerImage ? (
                          <Image 
                            src={user.bannerImage} 
                            alt="Banner" 
                            fill 
                            className="object-cover" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                        )}
                        
                        {(bannerImagePreview || user.bannerImage) && (
                          <button 
                            type="button"
                            onClick={clearBannerImage}
                            className="absolute top-2 right-2 rounded-full bg-background/80 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => bannerImageInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Change banner
                        </Button>
                        <input 
                          type="file" 
                          ref={bannerImageInputRef} 
                          onChange={handleBannerImageChange} 
                          className="hidden" 
                          accept="image/*" 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          16:9 aspect ratio recommended. 5MB max.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="pixel"
                onClick={handleSubmit(onSubmit)}
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