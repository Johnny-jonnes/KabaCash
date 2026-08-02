import { db } from './dexie';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { generateUUID } from '../utils/id';

export async function seedDatabase(userId: string) {
  // Check if categories already exist
  const existingCount = await db.categories.where('user_id').equals(userId).count();
  
  if (existingCount === 0) {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }));
    
    await db.categories.bulkAdd(categoriesToInsert);
  }
}
