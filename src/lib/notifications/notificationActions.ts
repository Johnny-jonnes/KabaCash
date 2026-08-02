import { db } from '@/lib/db/dexie';
import { generateUUID } from '@/lib/utils/id';
import { SyncEngine } from '@/lib/sync/engine';
import type { DBNotification } from '@/types/database';
import type { NotificationKind, NotificationTone } from '@/types/enums';

export interface NotificationInput {
  userId: string;
  kind: NotificationKind;
  tone: NotificationTone;
  title: string;
  body: string;
  href?: string;
}

/**
 * Crée une notification si aucune notification équivalente et non lue n'existe déjà
 * pour le même (kind, title) — évite d'empiler 30 fois "Budget bientôt atteint" à
 * chaque recalcul du moteur d'intelligence.
 */
export async function upsertNotification(input: NotificationInput): Promise<void> {
  const existing = await db.notifications
    .where('user_id').equals(input.userId)
    .filter(n => !n.deleted_at && !n.read_at && n.kind === input.kind && n.title === input.title)
    .first();

  if (existing) {
    if (existing.body === input.body) return; // rien de nouveau à dire
    const updated: DBNotification = { ...existing, body: input.body, updated_at: new Date().toISOString(), sync_status: 'pending' };
    await db.notifications.put(updated);
    await SyncEngine.queueOperation('notifications', updated.id, 'update', updated);
    return;
  }

  const now = new Date().toISOString();
  const notification: DBNotification = {
    id: generateUUID(),
    user_id: input.userId,
    kind: input.kind,
    tone: input.tone,
    title: input.title,
    body: input.body,
    href: input.href,
    read_at: null,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
  };
  await db.notifications.add(notification);
  await SyncEngine.queueOperation('notifications', notification.id, 'create', notification);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const notification = await db.notifications.get(notificationId);
  if (!notification || notification.read_at) return;
  const updated: DBNotification = { ...notification, read_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending' };
  await db.notifications.put(updated);
  await SyncEngine.queueOperation('notifications', notificationId, 'update', updated);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const unread = await db.notifications.where('user_id').equals(userId).filter(n => !n.read_at && !n.deleted_at).toArray();
  const now = new Date().toISOString();
  for (const notification of unread) {
    const updated: DBNotification = { ...notification, read_at: now, updated_at: now, sync_status: 'pending' };
    await db.notifications.put(updated);
    await SyncEngine.queueOperation('notifications', notification.id, 'update', updated);
  }
}

export async function dismissNotification(notificationId: string): Promise<void> {
  const notification = await db.notifications.get(notificationId);
  if (!notification) return;
  const now = new Date().toISOString();
  const updated: DBNotification = { ...notification, deleted_at: now, updated_at: now, sync_status: 'pending' };
  await db.notifications.put(updated);
  await SyncEngine.queueOperation('notifications', notificationId, 'delete', updated);
}
