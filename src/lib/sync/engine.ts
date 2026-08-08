import { db } from '../db/dexie';
import { SyncQueue } from './queue';
import { SyncStatus } from '@/types/enums';
import { createClient } from '@/lib/supabase/client';
import { useSyncStore } from '@/stores/syncStore';

// Au-delà de ce nombre d'échecs, un item n'est plus retenté automatiquement
// (il reste visible dans la file et repart via "Synchroniser maintenant").
const MAX_AUTO_RETRIES = 5;

// entity_type = nom exact de la table Supabase (voir supabase/migrations).
// activity_logs n'a pas de sync_status local (journal immuable) : pas de maj à faire.
const ENTITY_TYPES_WITH_LOCAL_STATUS = new Set([
  'transactions', 'accounts', 'categories', 'budgets',
  'budget_periods', 'recurring_transactions', 'transaction_templates', 'notifications', 'savings_goals',
  'planned_entries',
]);

// sync_status n'existe que côté client (Dexie) : aucune colonne Supabase ne le porte.
// Type `object` (et non `Record<string, unknown>`) : accepte les interfaces DBxxx fermées
// (DBCategory, DBTransaction...) sans exiger de signature d'index.
function toRemotePayload(payload: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'sync_status'));
}

export class SyncEngine {
  // Empêche des passages concurrents de processQueue() : une opération qui pousse
  // plusieurs entités d'affilée (ex: fusion de compte, "tout marquer comme lu") appelle
  // queueOperation() en boucle, et chaque appel déclenchait auparavant sa PROPRE passe
  // de processQueue() non attendue — plusieurs passes tournaient alors en même temps,
  // chacune lisant/écrivant la même file sans coordination. Un item pouvait ainsi être
  // traité deux fois ou son statut écrasé par une passe plus ancienne encore en cours,
  // ce qui pouvait laisser un élément marqué "en erreur" ou "en attente" alors qu'il
  // avait en réalité bien été envoyé (ou l'inverse). Un seul passage à la fois désormais ;
  // toute demande arrivée pendant qu'un passage tourne déclenche un second passage propre
  // juste après, plutôt que de se chevaucher avec le premier.
  private static runningQueue: Promise<void> | null = null;
  private static rerunRequested = false;

  static async queueOperation(
    entity_type: string,
    entity_id: string,
    operation: 'create' | 'update' | 'delete',
    payload: object
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

  /** @param force Ignore le plafond de tentatives — utilisé par "Synchroniser maintenant". */
  static async processQueue(force = false): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    if (this.runningQueue) {
      this.rerunRequested = true;
      return this.runningQueue;
    }

    this.runningQueue = this.runQueueOnce(force);
    try {
      await this.runningQueue;
    } finally {
      this.runningQueue = null;
      if (this.rerunRequested) {
        this.rerunRequested = false;
        await this.processQueue(force);
      }
    }
  }

  private static async runQueueOnce(force: boolean) {
    const pendingItems = await SyncQueue.getPendingItems();
    if (pendingItems.length === 0) return;

    const store = useSyncStore.getState();
    store.setSyncStatus(true);
    store.setSyncError(null);

    const supabase = createClient();
    let lastError: string | null = null;

    for (const item of pendingItems) {
      if (!force && item.retry_count >= MAX_AUTO_RETRIES) continue;

      try {
        // create / update / delete convergent tous vers un upsert : les suppressions
        // sont des soft-delete (deleted_at) transportées dans le payload complet,
        // donc l'opération est idempotente que la ligne existe déjà côté serveur ou non.
        const { error } = await supabase
          .from(item.entity_type)
          .upsert(toRemotePayload(item.payload));

        if (error) throw new Error(error.message);

        if (ENTITY_TYPES_WITH_LOCAL_STATUS.has(item.entity_type)) {
          await this.updateLocalSyncStatus(item.entity_type, item.entity_id, 'synced');
        }

        if (item.localId) {
          await SyncQueue.remove(item.localId);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (item.localId) {
          await SyncQueue.markError(item.localId, lastError);
        }
      }
    }

    store.setPendingCount(await SyncQueue.count());
    store.setSyncStatus(false);
    store.setSyncError(lastError);
    if (!lastError) store.setLastSyncTime(new Date().toISOString());
  }

  private static async updateLocalSyncStatus(entity_type: string, entity_id: string, status: SyncStatus) {
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
      case 'budget_periods':
        await db.budgetPeriods.update(entity_id, { sync_status: status });
        break;
      case 'recurring_transactions':
        await db.recurringTransactions.update(entity_id, { sync_status: status });
        break;
      case 'transaction_templates':
        await db.transactionTemplates.update(entity_id, { sync_status: status });
        break;
      case 'notifications':
        await db.notifications.update(entity_id, { sync_status: status });
        break;
      case 'savings_goals':
        await db.savingsGoals.update(entity_id, { sync_status: status });
        break;
      case 'planned_entries':
        await db.plannedEntries.update(entity_id, { sync_status: status });
        break;
    }
  }
}
