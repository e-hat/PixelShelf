// src/lib/notifications/stream.ts

/**
 * A simple in‐memory SSE connection manager for real‐time notifications.
 */

const connections = new Map<string, ReadableStreamDefaultController>();

/**
 * Add a new SSE connection controller for a given user.
 */
export function addConnection(
  userId: string,
  controller: ReadableStreamDefaultController
) {
  connections.set(userId, controller);
}

/**
 * Remove the SSE connection for a given user (e.g. on disconnect).
 */
export function removeConnection(userId: string) {
  connections.delete(userId);
}

/**
 * Send a single notification object to one connected user via SSE.
 */
export function sendNotificationToUser(
  userId: string,
  notification: any
) {
  const controller = connections.get(userId);
  if (!controller) return;

  try {
    const payload = {
      type: 'notification',
      data: notification,
    };
    const encoded = new TextEncoder().encode(
      `data: ${JSON.stringify(payload)}\n\n`
    );
    controller.enqueue(encoded);
  } catch {
    // If enqueue fails (e.g. connection closed), clean up
    connections.delete(userId);
  }
}

/**
 * Broadcast the same notification to multiple users.
 */
export function broadcastNotification(
  userIds: string[],
  notification: any
) {
  for (const id of userIds) {
    sendNotificationToUser(id, notification);
  }
}

/**
 * Send an updated unread-count payload to a specific user.
 */
export function updateUnreadCount(
  userId: string,
  count: number
) {
  const controller = connections.get(userId);
  if (!controller) return;

  try {
    const payload = {
      type: 'unread_count',
      count,
    };
    const encoded = new TextEncoder().encode(
      `data: ${JSON.stringify(payload)}\n\n`
    );
    controller.enqueue(encoded);
  } catch {
    connections.delete(userId);
  }
}
