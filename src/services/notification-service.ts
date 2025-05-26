// src/services/notification-service.ts
import { api } from '@/lib/api/api-client';
import type { Notification } from '@/types';

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
    types: {
      follow: boolean;
      like: boolean;
      comment: boolean;
      message: boolean;
      system: boolean;
    };
  };
  push: {
    enabled: boolean;
    types: {
      follow: boolean;
      like: boolean;
      comment: boolean;
      message: boolean;
      system: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private eventSource: EventSource | null = null;
  private reconnectInterval = 1000;
  private maxReconnectInterval = 30000;
  private reconnectAttempts = 0;
  private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize real-time notifications using Server-Sent Events
  async initialize(userId: string): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.userId = userId;

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      // Request notification permissions
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Setup SSE connection
      this.eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
      
      this.eventSource.onopen = () => {
        console.log('Notification stream connected');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        this.isConnecting = false;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            this.handleNotification(data.data);
          } else if (data.type === 'unread_count') {
            this.handleUnreadCount(data.count);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Notification stream error:', error);
        this.isConnecting = false;
        
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.reconnect(userId);
        }
      };
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      this.isConnecting = false;
    }
  }

  private reconnect(userId: string): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.reconnectAttempts++;
    const timeout = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectInterval
    );

    console.log(`Reconnecting notifications in ${timeout}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId === userId) {
        this.initialize(userId);
      }
    }, timeout);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.userId = null;
    this.isConnecting = false;
    this.listeners.clear();
  }

  // Subscribe to notification events
  subscribe(event: string, callback: (notification: Notification) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private handleNotification(notification: Notification): void {
    // Emit to all listeners
    this.emit('notification', notification);
    this.emit(`notification:${notification.type.toLowerCase()}`, notification);

    // Show browser notification if enabled
    this.showBrowserNotification(notification);

    // Play sound if enabled
    this.playNotificationSound();
  }

  private handleUnreadCount(count: number): void {
    // Emit unread count update
    this.emit('unread_count', { unreadCount: count } as any);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const preferences = await this.getPreferences();
    if (!preferences.inApp.desktop) {
      return;
    }

    const title = this.getNotificationTitle(notification);
    const options: NotificationOptions = {
      body: notification.content,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notification.id,
      //renotify: true,
      data: notification,
    };

    try {
      const browserNotification = new Notification(title, options);
      
      browserNotification.onclick = () => {
        window.focus();
        if (notification.linkUrl) {
          window.location.href = notification.linkUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => browserNotification.close(), 5000);
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  private getNotificationTitle(notification: Notification): string {
    switch (notification.type) {
      case 'FOLLOW':
        return 'New Follower';
      case 'LIKE':
        return 'New Like';
      case 'COMMENT':
        return 'New Comment';
      case 'MESSAGE':
        return 'New Message';
      case 'SYSTEM':
        return 'System Notification';
      default:
        return 'PixelShelf Notification';
    }
  }

  private async playNotificationSound(): Promise<void> {
    const preferences = await this.getPreferences();
    if (!preferences.inApp.sound) {
      return;
    }

    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      await audio.play();
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  // Get user notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = localStorage.getItem('notification-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Return default preferences
    return {
      email: {
        enabled: true,
        frequency: 'instant',
        types: {
          follow: true,
          like: true,
          comment: true,
          message: true,
          system: true,
        },
      },
      push: {
        enabled: true,
        types: {
          follow: true,
          like: true,
          comment: true,
          message: true,
          system: true,
        },
      },
      inApp: {
        enabled: true,
        sound: true,
        desktop: true,
      },
    };
  }

  // Save user notification preferences
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(preferences));
      await api.users.updateProfile({ notificationPreferences: preferences });
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      throw error;
    }
  }

  // Mark notifications as read with optimistic updates
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await api.notifications.markAsRead(notificationIds);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await api.notifications.markAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Archive notifications
  async archive(notificationIds: string[]): Promise<void> {
    try {
      //await api.notifications.archive(notificationIds);
    } catch (error) {
      console.error('Failed to archive notifications:', error);
      throw error;
    }
  }

  // Delete notifications
  async delete(notificationIds: string[]): Promise<void> {
    try {
      //await api.notifications.delete(notificationIds);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      throw error;
    }
  }
}

export const notificationService = NotificationService.getInstance();