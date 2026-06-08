import { db } from '../db/dexie';
import { SyncQueue } from './queue';
import { SyncStatus } from '@/types/enums';

export class SyncEngine {
  static async queueOperation(
    entity_type: string,
    entity_id: string,
    operation: 'create' | 'update' | 'delete',
    payload: any
  ) {
    await SyncQueue.add({
      entity_type,
      entity_id,
      operation,
      payload,
    });

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }
  }

  static async processQueue() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const pendingItems = await SyncQueue.getPendingItems();

    for (const item of pendingItems) {
      try {
        // Here we would call Supabase to sync the item
        // For now, since Supabase is phase 2 or deferred, we just mock success
        // or keep it pending if not configured.

        // Simulating successful sync
        // await supabase.from(item.entity_type).upsert(item.payload);
        
        // Update local status to synced
        if (item.operation !== 'delete') {
            await this.updateLocalSyncStatus(item.entity_type, item.entity_id, 'synced');
        }

        if (item.localId) {
          await SyncQueue.remove(item.localId);
        }
      } catch (error) {
        if (item.localId) {
          await SyncQueue.markError(item.localId, String(error));
        }
      }
    }
  }

  private static async updateLocalSyncStatus(entity_type: string, entity_id: string, status: SyncStatus) {
    // Determine the table based on entity_type
    switch (entity_type) {
      case 'transactions':
        await db.transactions.update(entity_id, { sync_status: status });
        break;
      case 'accounts':
        await db.accounts.update(entity_id, { sync_status: status });
        break;
      case 'categories':
        await db.categories.update(entity_id, { sync_status: status });
        break;
      case 'budgets':
        await db.budgets.update(entity_id, { sync_status: status });
        break;
    }
  }
}
