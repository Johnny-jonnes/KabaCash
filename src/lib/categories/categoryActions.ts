import { db } from '@/lib/db/dexie';
import { SyncEngine } from '@/lib/sync/engine';
import { logActivity } from '@/lib/db/activity-logger';
import type { DBCategory } from '@/types/database';

export async function setCategoryActive(category: DBCategory, isActive: boolean, userId: string) {
  const now = new Date().toISOString();
  const updated: DBCategory = { ...category, is_active: isActive, updated_at: now, sync_status: 'pending' };
  await db.categories.put(updated);
  await SyncEngine.queueOperation('categories', category.id, 'update', updated);
  await logActivity({
    user_id: userId,
    entity_type: 'category',
    entity_id: category.id,
    action: 'update',
    old_values: { is_active: category.is_active },
    new_values: { is_active: isActive },
    description: `Catégorie "${category.name}" ${isActive ? 'réactivée' : 'désactivée'}`,
  });
}

/** Persiste un nouvel ordre pour un lot de catégories (glisser-déposer sur la grille). */
export async function reorderCategories(orderedCategories: DBCategory[]) {
  for (let i = 0; i < orderedCategories.length; i++) {
    const cat = orderedCategories[i];
    if (cat.sort_order === i) continue;
    const updated: DBCategory = { ...cat, sort_order: i, updated_at: new Date().toISOString(), sync_status: 'pending' };
    await db.categories.put(updated);
    await SyncEngine.queueOperation('categories', cat.id, 'update', updated);
  }
}

/** Réattribue toutes les transactions/budgets de la catégorie source vers la cible, puis désactive la source. */
export async function mergeCategoriesAction(source: DBCategory, targetName: string, userId: string) {
  const now = () => new Date().toISOString();

  const affectedTx = await db.transactions.where('category_id').equals(source.name).toArray();
  for (const t of affectedTx) {
    const updated = { ...t, category_id: targetName, updated_at: now(), sync_status: 'pending' as const };
    await db.transactions.put(updated);
    await SyncEngine.queueOperation('transactions', t.id, 'update', updated);
  }

  const affectedBudgets = await db.budgets.where('category_id').equals(source.name).toArray();
  for (const b of affectedBudgets) {
    const updated = { ...b, category_id: targetName, updated_at: now(), sync_status: 'pending' as const };
    await db.budgets.put(updated);
    await SyncEngine.queueOperation('budgets', b.id, 'update', updated);
  }

  await setCategoryActive(source, false, userId);
  await logActivity({
    user_id: userId,
    entity_type: 'category',
    entity_id: source.id,
    action: 'update',
    old_values: { name: source.name },
    new_values: { merged_into: targetName },
    description: `Catégorie "${source.name}" fusionnée avec "${targetName}" (${affectedTx.length} transaction(s), ${affectedBudgets.length} budget(s) réattribués)`,
  });

  return { transactionsMoved: affectedTx.length, budgetsMoved: affectedBudgets.length };
}

/** Suppression définitive, uniquement si la catégorie n'a jamais été utilisée (sinon : désactiver ou fusionner). */
export async function deleteCategorySafe(category: DBCategory, userId: string): Promise<{ deleted: boolean; reason?: string }> {
  const [txCount, budgetCount] = await Promise.all([
    db.transactions.where('category_id').equals(category.name).count(),
    db.budgets.where('category_id').equals(category.name).count(),
  ]);

  if (txCount > 0 || budgetCount > 0) {
    return {
      deleted: false,
      reason: `Utilisée par ${txCount} transaction(s) et ${budgetCount} budget(s) : désactivez-la ou fusionnez-la plutôt.`,
    };
  }

  const now = new Date().toISOString();
  const deleted: DBCategory = { ...category, deleted_at: now, updated_at: now, sync_status: 'pending' };
  await db.categories.put(deleted);
  await SyncEngine.queueOperation('categories', category.id, 'delete', deleted);
  await logActivity({
    user_id: userId,
    entity_type: 'category',
    entity_id: category.id,
    action: 'delete',
    old_values: { name: category.name },
    description: `Catégorie "${category.name}" supprimée`,
  });

  return { deleted: true };
}
