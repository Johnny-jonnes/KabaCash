import { db } from '@/lib/db/dexie';
import { generateUUID } from '@/lib/utils/id';
import { logActivity } from '@/lib/db/activity-logger';
import { SyncEngine } from '@/lib/sync/engine';
import { createTransaction } from '@/lib/transactions/createTransaction';
import type { CategoryType } from '@/types/enums';
import type { DBPlannedEntry } from '@/types/database';

export interface PlannedEntryInput {
  userId: string;
  spaceId?: string | null;
  accountId?: string | null;
  categoryId: string;
  type: CategoryType;
  amount: number;
  currency: string;
  description?: string;
  plannedDate: string; // yyyy-MM-dd
}

export async function createPlannedEntry(input: PlannedEntryInput): Promise<DBPlannedEntry> {
  const count = await db.plannedEntries.where('user_id').equals(input.userId).count();
  const now = new Date().toISOString();
  const entry: DBPlannedEntry = {
    id: generateUUID(),
    user_id: input.userId,
    space_id: input.spaceId ?? null,
    account_id: input.accountId ?? null,
    category_id: input.categoryId,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    description: input.description || '',
    planned_date: input.plannedDate,
    status: 'planned',
    sort_order: count,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
  };

  await db.plannedEntries.add(entry);
  await SyncEngine.queueOperation('planned_entries', entry.id, 'create', entry);
  await logActivity({
    user_id: input.userId, entity_type: 'planned_entry', entity_id: entry.id, action: 'create',
    new_values: { category_id: entry.category_id, amount: entry.amount, planned_date: entry.planned_date },
    description: `Prévision "${entry.description || entry.category_id}" planifiée pour le ${entry.planned_date}`,
  });

  return entry;
}

export type PlannedEntryUpdate = Partial<Pick<PlannedEntryInput, 'accountId' | 'categoryId' | 'type' | 'amount' | 'description' | 'plannedDate'>>;

export async function updatePlannedEntry(entryId: string, userId: string, updates: PlannedEntryUpdate): Promise<void> {
  const entry = await db.plannedEntries.get(entryId);
  if (!entry || entry.deleted_at) return;
  const updated: DBPlannedEntry = {
    ...entry,
    account_id: updates.accountId !== undefined ? updates.accountId : entry.account_id,
    category_id: updates.categoryId ?? entry.category_id,
    type: updates.type ?? entry.type,
    amount: updates.amount ?? entry.amount,
    description: updates.description ?? entry.description,
    planned_date: updates.plannedDate ?? entry.planned_date,
    updated_at: new Date().toISOString(),
    sync_status: 'pending',
  };
  await db.plannedEntries.put(updated);
  await SyncEngine.queueOperation('planned_entries', entryId, 'update', updated);
  await logActivity({
    user_id: userId, entity_type: 'planned_entry', entity_id: entryId, action: 'update',
    old_values: { amount: entry.amount, planned_date: entry.planned_date },
    new_values: { amount: updated.amount, planned_date: updated.planned_date },
    description: `Prévision "${updated.description || updated.category_id}" modifiée`,
  });
}

export async function deletePlannedEntry(entryId: string, userId: string): Promise<void> {
  const entry = await db.plannedEntries.get(entryId);
  if (!entry || entry.deleted_at) return;
  const now = new Date().toISOString();
  const deleted: DBPlannedEntry = { ...entry, deleted_at: now, updated_at: now, sync_status: 'pending' };
  await db.plannedEntries.put(deleted);
  await SyncEngine.queueOperation('planned_entries', entryId, 'delete', deleted);
  await logActivity({
    user_id: userId, entity_type: 'planned_entry', entity_id: entryId, action: 'delete',
    old_values: { category_id: entry.category_id, amount: entry.amount },
    description: `Prévision "${entry.description || entry.category_id}" supprimée`,
  });
}

/**
 * Convertit une entrée planifiée en vraie transaction (via createTransaction, donc
 * avec effet réel sur le solde) et marque l'entrée comme réalisée. Le compte doit
 * être choisi ici s'il n'était pas déjà fixé au moment de la planification.
 */
export async function realizePlannedEntry(entryId: string, userId: string, accountId: string): Promise<void> {
  const entry = await db.plannedEntries.get(entryId);
  if (!entry || entry.deleted_at) throw new Error('Prévision introuvable');
  if (entry.status === 'realized') throw new Error('Cette prévision a déjà été réalisée');

  const tx = await createTransaction({
    userId, accountId, type: entry.type, amount: entry.amount, currency: entry.currency,
    categoryId: entry.category_id, description: entry.description || undefined,
    date: new Date().toISOString().split('T')[0],
  });

  const now = new Date().toISOString();
  const updated: DBPlannedEntry = {
    ...entry, account_id: accountId, status: 'realized', realized_transaction_id: tx.id,
    updated_at: now, sync_status: 'pending',
  };
  await db.plannedEntries.put(updated);
  await SyncEngine.queueOperation('planned_entries', entryId, 'update', updated);
  await logActivity({
    user_id: userId, entity_type: 'planned_entry', entity_id: entryId, action: 'update',
    new_values: { status: 'realized', realized_transaction_id: tx.id },
    description: `Prévision "${entry.description || entry.category_id}" réalisée`,
  });
}

export async function skipPlannedEntry(entryId: string, userId: string): Promise<void> {
  const entry = await db.plannedEntries.get(entryId);
  if (!entry || entry.deleted_at) return;
  const now = new Date().toISOString();
  const updated: DBPlannedEntry = { ...entry, status: 'skipped', updated_at: now, sync_status: 'pending' };
  await db.plannedEntries.put(updated);
  await SyncEngine.queueOperation('planned_entries', entryId, 'update', updated);
  await logActivity({
    user_id: userId, entity_type: 'planned_entry', entity_id: entryId, action: 'update',
    new_values: { status: 'skipped' },
    description: `Prévision "${entry.description || entry.category_id}" marquée comme non réalisée`,
  });
}
