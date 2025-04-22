'use client';

import { useState, useRef } from 'react';
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

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username must be at most 30 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  bio: z.string().max(500, { message: 'Bio must be at most 500 characters' }).optional(),
  role: z.string().optional(),
  website: z.string().optional(),
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
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
  });

  // Pre-fill the form with user data if available
  if (session?.user?.name && !profileImagePreview && session.user.image) {
    setProfileImagePreview(session.user.image);
  }

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

  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    setValue('role', roleId);
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);

    // In a real app, this would update the user profile in the database
    // For the MVP, we'll simulate a successful update after a short delay
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, we would also update the session
      if (update) {
        await update({
          ...session,
          user: {
            ...session?.user,
            username: data.username,
            image: profileImagePreview || session?.user?.image,
          },
        });
      }

      toast.success('Profile set up successfully!');
      
      // Redirect to the home page
      router.push('/');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to set up profile. Please try again.');
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

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Stage 1: Profile Photo */}
          {stage === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div
                  className="relative h-32 w-32 rounded-full overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <Image 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleProfileImageChange} 
                  className="hidden" 
                  accept="image/*" 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG or GIF. 2MB max.
                </p>
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
                {profileImagePreview ? (
                  <p className="text-xs text-muted-foreground mt-2">Looks great!</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">You can also skip and add a photo later</p>
                )}
              </div>
            </div>
          )}

          {/* Stage 2: Basic Info */}
          {stage === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
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
                      placeholder="your_username"
                      defaultValue={session.user.username || ''}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This will be your unique identifier on PixelShelf
                  </p>
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
                  <label htmlFor="website" className="text-sm font-medium">
                    Website (optional)
                  </label>
                  <Input 
                    id="website" 
                    {...register('website')} 
                    placeholder="example.com"
                  />
                </div>
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
      </div>
    </div>
  );
}