import { db } from './dexie';
import { generateUUID } from '../utils/id';

export async function logActivity(params: {
  user_id: string;
  entity_type: 'transaction' | 'budget' | 'account' | 'category' | 'transaction_template' | 'savings_goal' | 'debt' | 'space' | 'planned_entry';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  description: string;
}) {
  await db.activityLogs.add({
    id: generateUUID(),
    ...params,
    created_at: new Date().toISOString(),
  });
}
