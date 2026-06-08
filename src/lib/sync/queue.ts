import { db } from '../db/dexie';
import { DBSyncQueueItem } from '@/types/database';

export class SyncQueue {
  static async add(item: Omit<DBSyncQueueItem, 'localId' | 'created_at' | 'retry_count'>) {
    await db.syncQueue.add({
      ...item,
      created_at: new Date().toISOString(),
      retry_count: 0,
    });
  }

  static async getPendingItems(): Promise<DBSyncQueueItem[]> {
    return await db.syncQueue.orderBy('created_at').toArray();
  }

  static async remove(localId: number) {
    await db.syncQueue.delete(localId);
  }

  static async markError(localId: number, error: string) {
    const item = await db.syncQueue.get(localId);
    if (item) {
      await db.syncQueue.update(localId, {
        retry_count: item.retry_count + 1,
        last_error: error,
      });
    }
  }
}
