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
    // Comparer aussi tone/href, pas seulement body : une alerte de budget qui passe de
    // "warning" (80%) à "critical" (100%+) garde le même titre (voir generate.ts) —
    // sans mettre à jour le tone ici, elle resterait affichée en orange alors qu'elle
    // est devenue critique.
    if (existing.body === input.body && existing.tone === input.tone && existing.href === input.href) return;
    const updated: DBNotification = { ...existing, body: input.body, tone: input.tone, href: input.href, updated_at: new Date().toISOString(), sync_status: 'pending' };
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

/**
 * Marque comme lues (résolues) les alertes non lues d'un type donné dont le titre ne
 * correspond plus à aucune alerte actuellement valide — ex: un budget repassé sous le
 * seuil ne doit pas laisser son ancienne alerte affichée indéfiniment comme si le
 * problème persistait encore. S'appuie sur des titres stables (voir generate.ts) pour
 * reconnaître "la même" alerte d'un recalcul à l'autre.
 */
export async function resolveStaleNotifications(userId: string, kind: NotificationKind, stillValidTitles: Set<string>): Promise<void> {
  const stale = await db.notifications
    .where('user_id').equals(userId)
    .filter(n => n.kind === kind && !n.read_at && !n.deleted_at && !stillValidTitles.has(n.title))
    .toArray();
  const now = new Date().toISOString();
  for (const notification of stale) {
    const updated: DBNotification = { ...notification, read_at: now, updated_at: now, sync_status: 'pending' };
    await db.notifications.put(updated);
    await SyncEngine.queueOperation('notifications', notification.id, 'update', updated);
  }
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

/** Supprime (suppression douce) toutes les notifications déjà lues d'un coup. */
export async function deleteAllReadNotifications(userId: string): Promise<number> {
  const read = await db.notifications.where('user_id').equals(userId).filter(n => !!n.read_at && !n.deleted_at).toArray();
  const now = new Date().toISOString();
  for (const notification of read) {
    const updated: DBNotification = { ...notification, deleted_at: now, updated_at: now, sync_status: 'pending' };
    await db.notifications.put(updated);
    await SyncEngine.queueOperation('notifications', notification.id, 'delete', updated);
  }
  return read.length;
}

const CLEANUP_STORAGE_KEY = 'kabacash_notif_cleanup_last_run';
const CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Nettoyage automatique hebdomadaire des notifications lues — appelé une fois par
 * session (voir NotificationGenerator) mais ne s'exécute réellement que si 7 jours
 * se sont écoulés depuis le dernier passage (horodatage en localStorage, propre à
 * cet appareil : chaque appareil fait son propre ménage local, pas de coordination
 * multi-appareils nécessaire pour une simple purge de confort).
 */
export async function runWeeklyNotificationCleanupIfDue(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const lastRun = localStorage.getItem(CLEANUP_STORAGE_KEY);
  if (lastRun && Date.now() - new Date(lastRun).getTime() < CLEANUP_INTERVAL_MS) return;

  await deleteAllReadNotifications(userId);
  localStorage.setItem(CLEANUP_STORAGE_KEY, new Date().toISOString());
}
