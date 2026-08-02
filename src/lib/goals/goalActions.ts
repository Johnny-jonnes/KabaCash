import { db } from '@/lib/db/dexie';
import { generateUUID } from '@/lib/utils/id';
import { logActivity } from '@/lib/db/activity-logger';
import { SyncEngine } from '@/lib/sync/engine';
import { createTransaction } from '@/lib/transactions/createTransaction';
import { upsertNotification } from '@/lib/notifications/notificationActions';
import type { DBSavingsGoal } from '@/types/database';

const GOAL_CATEGORY = 'Épargne';

export interface GoalInput {
  userId: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  targetDate: string;
  accountId?: string;
  spaceId?: string | null;
}

export async function createGoal(input: GoalInput): Promise<DBSavingsGoal> {
  const count = await db.savingsGoals.where('user_id').equals(input.userId).count();
  const now = new Date().toISOString();
  const goal: DBSavingsGoal = {
    id: generateUUID(),
    user_id: input.userId,
    space_id: input.spaceId ?? null,
    name: input.name,
    icon: input.icon,
    color: input.color,
    target_amount: input.targetAmount,
    current_amount: 0,
    target_date: input.targetDate,
    account_id: input.accountId,
    sort_order: count,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
  };

  await db.savingsGoals.add(goal);
  await SyncEngine.queueOperation('savings_goals', goal.id, 'create', goal);
  await logActivity({
    user_id: input.userId, entity_type: 'savings_goal', entity_id: goal.id, action: 'create',
    new_values: { name: goal.name, target_amount: goal.target_amount },
    description: `Objectif "${goal.name}" créé (${goal.target_amount} GNF)`,
  });

  return goal;
}

export async function updateGoal(goalId: string, userId: string, updates: Partial<Pick<GoalInput, 'name' | 'icon' | 'color' | 'targetAmount' | 'targetDate' | 'accountId'>>): Promise<void> {
  const goal = await db.savingsGoals.get(goalId);
  if (!goal) return;
  const updated: DBSavingsGoal = {
    ...goal,
    name: updates.name ?? goal.name,
    icon: updates.icon ?? goal.icon,
    color: updates.color ?? goal.color,
    target_amount: updates.targetAmount ?? goal.target_amount,
    target_date: updates.targetDate ?? goal.target_date,
    account_id: updates.accountId ?? goal.account_id,
    updated_at: new Date().toISOString(),
    sync_status: 'pending',
  };
  await db.savingsGoals.put(updated);
  await SyncEngine.queueOperation('savings_goals', goalId, 'update', updated);
}

/**
 * Contribue à un objectif via une vraie transaction de dépense (catégorie "Épargne")
 * depuis le compte choisi : l'argent mis de côté impacte réellement le solde du
 * compte, comme n'importe quelle dépense — un objectif n'est pas qu'un compteur.
 */
export async function contributeToGoal(goal: DBSavingsGoal, amount: number, accountId: string, userId: string): Promise<void> {
  if (amount <= 0) throw new Error('Le montant doit être positif');

  await createTransaction({
    userId, accountId, type: 'expense', amount, currency: 'GNF',
    categoryId: GOAL_CATEGORY, description: `Épargne : ${goal.name}`,
    date: new Date().toISOString().split('T')[0],
  });

  const wasReached = goal.current_amount >= goal.target_amount;
  const newAmount = goal.current_amount + amount;
  const now = new Date().toISOString();
  const updated: DBSavingsGoal = {
    ...goal,
    current_amount: newAmount,
    reached_at: !wasReached && newAmount >= goal.target_amount ? now : goal.reached_at,
    updated_at: now,
    sync_status: 'pending',
  };
  await db.savingsGoals.put(updated);
  await SyncEngine.queueOperation('savings_goals', goal.id, 'update', updated);
  await logActivity({
    user_id: userId, entity_type: 'savings_goal', entity_id: goal.id, action: 'update',
    old_values: { current_amount: goal.current_amount }, new_values: { current_amount: newAmount },
    description: `Contribution de ${amount} GNF à l'objectif "${goal.name}"`,
  });

  if (!wasReached && newAmount >= goal.target_amount) {
    await upsertNotification({
      userId, kind: 'goal_reached', tone: 'positive',
      title: `Objectif "${goal.name}" atteint !`,
      body: `Vous avez atteint votre objectif de ${goal.target_amount.toLocaleString('fr-GN')} GNF. Félicitations !`,
      href: '/goals',
    });
  }
}

export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  const goal = await db.savingsGoals.get(goalId);
  if (!goal) return;
  const now = new Date().toISOString();
  const deleted: DBSavingsGoal = { ...goal, deleted_at: now, updated_at: now, sync_status: 'pending' };
  await db.savingsGoals.put(deleted);
  await SyncEngine.queueOperation('savings_goals', goalId, 'delete', deleted);
  await logActivity({
    user_id: userId, entity_type: 'savings_goal', entity_id: goalId, action: 'delete',
    old_values: { name: goal.name }, description: `Objectif "${goal.name}" supprimé`,
  });
}
