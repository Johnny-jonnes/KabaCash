import { db } from '../db/dexie';
import { DBSyncQueueItem } from '@/types/database';

export class SyncQueue {
  /**
   * Ajoute une opération à la file. Si une opération est déjà en attente pour
   * la même entité, elle est remplacée par la plus récente (dédoublonnage) :
   * pas besoin de renvoyer 3 upserts si le même montant a été corrigé 3 fois
   * avant de retrouver du réseau — seul l'état final compte.
   */
  static async add(item: Omit<DBSyncQueueItem, 'localId' | 'created_at' | 'retry_count'>) {
    const existing = await db.syncQueue
      .where('entity_type').equals(item.entity_type)
      .filter(q => q.entity_id === item.entity_id)
      .first();

    if (existing?.localId) {
      await db.syncQueue.update(existing.localId, {
        operation: item.operation,
        payload: item.payload,
        created_at: new Date().toISOString(),
        retry_count: 0,
        last_error: undefined,
      });
      return;
    }

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

  static async count(): Promise<number> {
    return db.syncQueue.count();
  }
}
