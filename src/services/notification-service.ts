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
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastEventTime = Date.now();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(userId: string): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      if (this.userId !== userId) {
        // User changed, disconnect and reconnect
        this.disconnect();
      } else {
        return;
      }
    }

    this.isConnecting = true;
    this.userId = userId;

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      // Request notification permissions if in browser
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Setup SSE connection
      this.eventSource = new EventSource(`/api/notifications/stream`);
      
      this.eventSource.onopen = () => {
        console.log('Notification stream connected');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        this.isConnecting = false;
        this.lastEventTime = Date.now();
        this.startHeartbeatMonitor();
      };

      this.eventSource.onmessage = (event) => {
        this.lastEventTime = Date.now();
        
        // Handle heartbeat
        if (event.data.trim() === ': heartbeat') {
          return;
        }
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            this.handleNotification(data.data);
          } else if (data.type === 'unread_count') {
            this.handleUnreadCount(data);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Notification stream error:', error);
        this.isConnecting = false;
        
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.handleReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private startHeartbeatMonitor(): void {
    // Clear existing timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Check for heartbeat every 45 seconds (heartbeat should come every 30s)
    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTime;
      if (timeSinceLastEvent > 45000) {
        console.warn('No heartbeat received, reconnecting...');
        this.handleReconnect();
      }
    }, 45000);
  }

  private handleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Clean up current connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (!this.userId) return;

    this.reconnectAttempts++;
    const timeout = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectInterval
    );

    console.log(`Reconnecting notifications in ${timeout}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.userId) {
        this.initialize(this.userId);
      }
    }, timeout);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.userId = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
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
    if (typeof window !== 'undefined') {
      this.showBrowserNotification(notification);
    }

    // Play sound if enabled
    this.playNotificationSound();
  }

  private handleUnreadCount(data: { count: number }): void {
    this.emit('unread_count', data);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in notification listener for event ${event}:`, error);
        }
      });
    }
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
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
    if (typeof window === 'undefined') return;
    
    const preferences = await this.getPreferences();
    if (!preferences.inApp.sound) {
      return;
    }

    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      await audio.play();
    } catch (error) {
      // Silently fail - user might not have interacted with page yet
    }
  }

  async getPreferences(): Promise<NotificationPreferences> {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences();
    }

    try {
      const stored = localStorage.getItem('notification-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    return this.getDefaultPreferences();
  }

  private getDefaultPreferences(): NotificationPreferences {
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
        sound: false, // Default to false to avoid annoying users
        desktop: true,
      },
    };
  }

  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('notification-preferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save notification preferences locally:', error);
      }
    }

    try {
      // Save to server
      await api.users.updateProfile({ notificationPreferences: preferences });
    } catch (error) {
      console.error('Failed to save notification preferences to server:', error);
      throw error;
    }
  }

  async markAsRead(notificationIds: string[]): Promise<void> {
    await api.notifications.markAsRead(notificationIds);
  }

  async markAllAsRead(): Promise<void> {
    await api.notifications.markAsRead();
  }
}

export const notificationService = NotificationService.getInstance();