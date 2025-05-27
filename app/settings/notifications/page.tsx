// app/settings/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Volume2, 
  Monitor,
  Loader2,
  Check,
  X,
  Info
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator';
import SettingsLayout from '@/components/layout/settings-layout';
import { notificationService, NotificationPreferences } from '@/services/notification-service';
import { Badge } from '@/components/ui/badge';

const NOTIFICATION_TYPES = [
  {
    id: 'follow',
    label: 'New Followers',
    description: 'When someone follows you',
    icon: '👤',
  },
  {
    id: 'like',
    label: 'Likes',
    description: 'When someone likes your content',
    icon: '❤️',
  },
  {
    id: 'comment',
    label: 'Comments',
    description: 'When someone comments on your content',
    icon: '💬',
  },
  {
    id: 'message',
    label: 'Messages',
    description: 'When you receive a new message',
    icon: '✉️',
  },
  {
    id: 'system',
    label: 'System Updates',
    description: 'Important updates and announcements',
    icon: '🔔',
  },
];

export default function NotificationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await notificationService.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadPreferences();
    }
  }, [status]);

  const handleSave = async () => {
    if (!preferences) return;
    
    setIsSaving(true);
    try {
      await notificationService.savePreferences(preferences);
      setHasChanges(false);
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (path: string[], value: any) => {
    if (!preferences) return;
    
    const newPrefs = JSON.parse(JSON.stringify(preferences));
    let current = newPrefs;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setPreferences(newPrefs);
    setHasChanges(true);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Desktop notifications enabled');
      } else {
        toast.error('Desktop notifications were denied');
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <SettingsLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SettingsLayout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted p-6 rounded-full">
            <Bell className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in to manage notifications</h1>
          <p className="text-muted-foreground">
            You need to sign in to view and update your notification settings.
          </p>
          <Button variant="pixel" onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <SettingsLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load preferences</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground">
            Choose how and when you want to be notified about activity on PixelShelf.
          </p>
        </div>

        {/* Browser Notification Permission */}
        {typeof window !== 'undefined' && 'Notification' in window && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-5 w-5" />
                Browser Notifications
              </CardTitle>
              <CardDescription>
                Allow PixelShelf to send you desktop notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={Notification.permission === 'granted' ? 'default' : 'secondary'}>
                    {Notification.permission === 'granted' ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Enabled
                      </>
                    ) : Notification.permission === 'denied' ? (
                      <>
                        <X className="mr-1 h-3 w-3" />
                        Blocked
                      </>
                    ) : (
                      'Not enabled'
                    )}
                  </Badge>
                </div>
                {Notification.permission !== 'granted' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestNotificationPermission}
                    disabled={Notification.permission === 'denied'}
                  >
                    {Notification.permission === 'denied' ? 'Blocked by browser' : 'Enable'}
                  </Button>
                )}
              </div>
              {Notification.permission === 'denied' && (
                <p className="text-sm text-muted-foreground mt-2">
                  <Info className="inline h-3 w-3 mr-1" />
                  You've blocked notifications. Please enable them in your browser settings.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Control notifications within PixelShelf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="in-app-enabled">Enable in-app notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in the notification center
                </p>
              </div>
              <Switch
                id="in-app-enabled"
                checked={preferences.inApp.enabled}
                onCheckedChange={(checked: any) => updatePreference(['inApp', 'enabled'], checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="in-app-sound" className="flex items-center">
                  <Volume2 className="mr-2 h-4 w-4" />
                  Notification sounds
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play a sound when you receive a notification
                </p>
              </div>
              <Switch
                id="in-app-sound"
                checked={preferences.inApp.sound}
                onCheckedChange={(checked: any) => updatePreference(['inApp', 'sound'], checked)}
                disabled={!preferences.inApp.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="in-app-desktop" className="flex items-center">
                  <Monitor className="mr-2 h-4 w-4" />
                  Desktop notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show browser notifications when PixelShelf is open
                </p>
              </div>
              <Switch
                id="in-app-desktop"
                checked={preferences.inApp.desktop}
                onCheckedChange={(checked: any) => updatePreference(['inApp', 'desktop'], checked)}
                disabled={!preferences.inApp.enabled || Notification.permission !== 'granted'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which notifications you want to receive via email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled">Enable email notifications</Label>
              <Switch
                id="email-enabled"
                checked={preferences.email.enabled}
                onCheckedChange={(checked: any) => updatePreference(['email', 'enabled'], checked)}
              />
            </div>
            
            {preferences.email.enabled && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <Label>Email frequency</Label>
                  <RadioGroup
                    value={preferences.email.frequency}
                    onValueChange={(value: any) => updatePreference(['email', 'frequency'], value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="instant" id="instant" />
                      <Label htmlFor="instant">Instant (as they happen)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily digest</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly digest</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label>Notification types</Label>
                  {NOTIFICATION_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <Label htmlFor={`email-${type.id}`}>{type.label}</Label>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <Switch
                        id={`email-${type.id}`}
                        checked={preferences.email.types[type.id as keyof typeof preferences.email.types]}
                        onCheckedChange={(checked: any) => 
                          updatePreference(['email', 'types', type.id], checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="mr-2 h-5 w-5" />
              Push Notifications
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Get notifications on your mobile device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Push notifications will be available in a future update. 
              We'll notify you when this feature is ready!
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end space-x-4 sticky bottom-4">
            <Card className="p-4 shadow-lg">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-muted-foreground">You have unsaved changes</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="pixel"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}