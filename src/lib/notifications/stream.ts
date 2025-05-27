// src/lib/notifications/stream.ts

/**
 * A simple in‐memory SSE connection manager for real‐time notifications.
 */

const connections = new Map<string, WritableStreamDefaultWriter<Uint8Array>>();

/**
 * Add a new SSE connection writer for a given user.
 */
export function addConnection(
  userId: string,
  writer: WritableStreamDefaultWriter<Uint8Array>
) {
  connections.set(userId, writer);
}

/**
 * Remove the SSE connection for a given user (e.g. on disconnect).
 */
export function removeConnection(userId: string) {
  const writer = connections.get(userId);
  if (!writer) return;
  writer.close().catch(() => {});
  connections.delete(userId);
}

/**
 * Send a single notification object to one connected user via SSE.
 */
export function sendNotificationToUser(
  userId: string,
  notification: any
) {
  const writer = connections.get(userId);
  if (!writer) return;

  try {
    const payload = {
      type: 'notification',
      data: notification,
    };
    const encoded = new TextEncoder().encode(
      `data: ${JSON.stringify(payload)}\n\n`
    );
    writer.write(encoded).catch(() => {
      removeConnection(userId);
    });
  } catch {
    removeConnection(userId);
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
  const writer = connections.get(userId);
  if (!writer) return;

  try {
    const payload = {
      type: 'unread_count',
      count,
    };
    const encoded = new TextEncoder().encode(
      `data: ${JSON.stringify(payload)}\n\n`
    );
    writer.write(encoded).catch(() => {
      removeConnection(userId);
    });
  } catch {
    removeConnection(userId);
  }
}
