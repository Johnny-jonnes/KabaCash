import { db } from '@/lib/db/dexie';
import { generateUUID } from '@/lib/utils/id';
import { logActivity } from '@/lib/db/activity-logger';
import { SyncEngine } from '@/lib/sync/engine';
import type { CategoryType } from '@/types/enums';

/**
 * Retrouve une catégorie par son nom (identifiant fonctionnel utilisé partout
 * dans l'app — transactions/budgets stockent category_id = nom de catégorie),
 * ou la crée si elle n'existe pas encore (cas "Autres dépenses" avec un nom
 * personnalisé saisi par l'utilisateur).
 */
export async function resolveOrCreateCategory(params: {
  userId: string;
  name: string;
  type: CategoryType;
}): Promise<string> {
  const name = params.name.trim();
  const existing = await db.categories.where('name').equalsIgnoreCase(name).first();
  if (existing && !existing.deleted_at) return existing.name;

  const lastOrder = await db.categories.where('user_id').equals(params.userId).count();

  const category = {
    id: generateUUID(),
    user_id: params.userId,
    name,
    icon: 'tag',
    color: '#6B7280',
    type: params.type,
    is_default: false,
    is_active: true,
    sort_order: lastOrder,
    sync_status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  await db.categories.add(category);
  await SyncEngine.queueOperation('categories', category.id, 'create', category);
  await logActivity({
    user_id: params.userId,
    entity_type: 'category',
    entity_id: category.id,
    action: 'create',
    new_values: { name: category.name, type: category.type },
    description: `Catégorie "${category.name}" créée`,
  });

  return category.name;
}
