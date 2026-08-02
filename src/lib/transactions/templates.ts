import { db } from '@/lib/db/dexie';
import { generateUUID } from '@/lib/utils/id';
import { logActivity } from '@/lib/db/activity-logger';
import { SyncEngine } from '@/lib/sync/engine';
import { createTransaction, type TransactionInput } from '@/lib/transactions/createTransaction';
import type { DBTransactionTemplate } from '@/types/database';

export interface TemplateInput {
  userId: string;
  label: string;
  type: TransactionInput['type'];
  accountId: string;
  categoryId?: string;
  transferToAccountId?: string;
  amount?: number;
  description?: string;
  icon?: string;
  color?: string;
}

export async function createTemplate(input: TemplateInput): Promise<DBTransactionTemplate> {
  const count = await db.transactionTemplates.where('user_id').equals(input.userId).count();
  const now = new Date().toISOString();
  const template: DBTransactionTemplate = {
    id: generateUUID(),
    user_id: input.userId,
    label: input.label.trim(),
    type: input.type,
    account_id: input.accountId,
    category_id: input.categoryId,
    transfer_to_account_id: input.transferToAccountId,
    amount: input.amount,
    description: input.description,
    icon: input.icon,
    color: input.color,
    sort_order: count,
    use_count: 0,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
  };

  await db.transactionTemplates.add(template);
  await SyncEngine.queueOperation('transaction_templates', template.id, 'create', template);
  await logActivity({
    user_id: input.userId,
    entity_type: 'transaction_template',
    entity_id: template.id,
    action: 'create',
    new_values: { label: template.label },
    description: `Favori "${template.label}" créé`,
  });

  return template;
}

/** Recrée une transaction depuis un favori en un geste. Nécessite que le favori ait un montant fixe. */
export async function applyTemplate(template: DBTransactionTemplate, userId: string) {
  if (template.amount === undefined || template.amount === null) {
    throw new Error('Ce favori nécessite de saisir un montant');
  }

  const tx = await createTransaction({
    userId,
    accountId: template.account_id,
    type: template.type,
    amount: template.amount,
    currency: 'GNF',
    categoryId: template.category_id,
    description: template.description || template.label,
    date: new Date().toISOString().split('T')[0],
    transferToAccountId: template.transfer_to_account_id,
  });

  const now = new Date().toISOString();
  const updated = { ...template, use_count: template.use_count + 1, last_used_at: now, updated_at: now, sync_status: 'pending' as const };
  await db.transactionTemplates.put(updated);
  await SyncEngine.queueOperation('transaction_templates', template.id, 'update', updated);

  return tx;
}

export async function deleteTemplate(templateId: string, userId: string): Promise<void> {
  const template = await db.transactionTemplates.get(templateId);
  if (!template) return;
  const now = new Date().toISOString();
  const deleted = { ...template, deleted_at: now, updated_at: now, sync_status: 'pending' as const };
  await db.transactionTemplates.put(deleted);
  await SyncEngine.queueOperation('transaction_templates', templateId, 'delete', deleted);
  await logActivity({
    user_id: userId,
    entity_type: 'transaction_template',
    entity_id: templateId,
    action: 'delete',
    old_values: { label: template.label },
    description: `Favori "${template.label}" supprimé`,
  });
}
