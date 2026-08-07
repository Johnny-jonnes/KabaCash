import { db } from './dexie';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { generateUUID } from '../utils/id';
import { SyncEngine } from '../sync/engine';

/**
 * Insère les catégories par défaut si elles n'existent pas encore. Vérifie
 * spécifiquement la présence de catégories is_default=true (pas juste "l'utilisateur
 * a-t-il une catégorie ?") : sinon, un utilisateur ayant déjà créé une catégorie
 * personnalisée avant que ce correctif n'existe ne recevrait jamais ses catégories
 * par défaut, puisque son compte de catégories ne serait plus à zéro.
 */
export async function seedDatabase(userId: string) {
  const existingDefaultsCount = await db.categories.where('user_id').equals(userId).filter(c => c.is_default === true).count();
  if (existingDefaultsCount > 0) return;

  const now = new Date().toISOString();
  const categoriesToInsert = DEFAULT_CATEGORIES.map((cat, index) => ({
    id: generateUUID(),
    user_id: userId,
    name: cat.name,
    icon: cat.icon,
    type: cat.type,
    color: cat.color,
    is_default: true,
    is_active: true,
    sort_order: index,
    sync_status: 'pending' as const,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }));

  await db.categories.bulkAdd(categoriesToInsert);
  for (const category of categoriesToInsert) {
    await SyncEngine.queueOperation('categories', category.id, 'create', category);
  }
}
