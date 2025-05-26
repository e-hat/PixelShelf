// src/lib/notifications/notification-helper.ts
import prisma from '@/lib/db/prisma';
import { NotificationType } from '@prisma/client';
import { sendNotificationToUser } from '@/app/api/notifications/stream/route';

interface CreateNotificationOptions {
  type: NotificationType;
  content: string;
  linkUrl?: string | null;
  receiverId: string;
  senderId?: string | null;
  metadata?: Record<string, any>;
}

export class NotificationHelper {
  /**
   * Create a notification and send it in real-time
   */
  static async create(options: CreateNotificationOptions) {
    const { type, content, linkUrl, receiverId, senderId, metadata } = options;

    // Don't create notifications for actions on own content
    if (senderId && senderId === receiverId) {
      return null;
    }

    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          type,
          content,
          linkUrl,
          receiverId,
          senderId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Send real-time notification
      sendNotificationToUser(receiverId, notification);

      // Queue email notification if enabled
      if (metadata?.sendEmail) {
        await this.queueEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Create a follow notification
   */
  static async createFollowNotification(followerId: string, followingId: string) {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true, username: true },
    });

    if (!follower) return null;

    return this.create({
      type: 'FOLLOW',
      content: `started following you`,
      linkUrl: `/u/${follower.username}`,
      receiverId: followingId,
      senderId: followerId,
    });
  }

  /**
   * Create a like notification for an asset
   */
  static async createAssetLikeNotification(likerId: string, assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { 
        title: true, 
        userId: true,
        user: {
          select: { name: true, username: true },
        },
      },
    });

    if (!asset || asset.userId === likerId) return null;

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { name: true },
    });

    if (!liker) return null;

    return this.create({
      type: 'LIKE',
      content: `liked your asset "${asset.title}"`,
      linkUrl: `/assets/${assetId}`,
      receiverId: asset.userId,
      senderId: likerId,
    });
  }

  /**
   * Create a like notification for a project
   */
  static async createProjectLikeNotification(likerId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        title: true, 
        userId: true,
        user: {
          select: { username: true },
        },
      },
    });

    if (!project || project.userId === likerId) return null;

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { name: true },
    });

    if (!liker) return null;

    return this.create({
      type: 'LIKE',
      content: `liked your project "${project.title}"`,
      linkUrl: `/u/${project.user.username}/projects/${projectId}`,
      receiverId: project.userId,
      senderId: likerId,
    });
  }

  /**
   * Create a comment notification
   */
  static async createCommentNotification(
    commenterId: string,
    assetId: string,
    commentContent: string,
    parentCommentUserId?: string
  ) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { 
        title: true, 
        userId: true,
      },
    });

    if (!asset) return null;

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
      select: { name: true },
    });

    if (!commenter) return null;

    const notifications = [];

    // Notify asset owner (if not the commenter)
    if (asset.userId !== commenterId) {
      const notification = await this.create({
        type: 'COMMENT',
        content: `commented on your asset "${asset.title}"`,
        linkUrl: `/assets/${assetId}#comments`,
        receiverId: asset.userId,
        senderId: commenterId,
      });
      if (notification) notifications.push(notification);
    }

    // Notify parent comment author if this is a reply
    if (parentCommentUserId && parentCommentUserId !== commenterId && parentCommentUserId !== asset.userId) {
      const notification = await this.create({
        type: 'COMMENT',
        content: `replied to your comment on "${asset.title}"`,
        linkUrl: `/assets/${assetId}#comments`,
        receiverId: parentCommentUserId,
        senderId: commenterId,
      });
      if (notification) notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Create a message notification
   */
  static async createMessageNotification(senderId: string, receiverId: string, messageContent: string) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, username: true },
    });

    if (!sender) return null;

    return this.create({
      type: 'MESSAGE',
      content: `sent you a message`,
      linkUrl: `/chat?with=${senderId}`,
      receiverId,
      senderId,
    });
  }

  /**
   * Create a system notification
   */
  static async createSystemNotification(
    receiverId: string,
    content: string,
    linkUrl?: string
  ) {
    return this.create({
      type: 'SYSTEM',
      content,
      linkUrl,
      receiverId,
    });
  }

  /**
   * Batch create notifications for multiple users
   */
  static async createBatch(
    receiverIds: string[],
    options: Omit<CreateNotificationOptions, 'receiverId'>
  ) {
    const notifications = await Promise.all(
      receiverIds.map(receiverId =>
        this.create({ ...options, receiverId })
      )
    );

    return notifications.filter(Boolean);
  }

  /**
   * Queue email notification (implement based on your email service)
   */
  private static async queueEmailNotification(notification: any) {
    // TODO: Implement email queuing logic
    // This could use a job queue like Bull or a service like SendGrid
    console.log('Email notification queued:', notification);
  }

  /**
   * Clean up old notifications
   */
  static async cleanupOldNotifications(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          read: true,
        },
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getUserNotificationStats(userId: string) {
    const [totalCount, unreadCount, typeBreakdown] = await Promise.all([
      prisma.notification.count({
        where: { receiverId: userId },
      }),
      prisma.notification.count({
        where: { receiverId: userId, read: false },
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { receiverId: userId },
        _count: true,
      }),
    ]);

    return {
      total: totalCount,
      unread: unreadCount,
      byType: typeBreakdown.reduce((acc, { type, _count }) => {
        acc[type] = _count;
        return acc;
      }, {} as Record<NotificationType, number>),
    };
  }
}