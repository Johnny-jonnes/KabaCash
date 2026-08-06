import { db } from '@/lib/db/dexie';
import { SyncEngine } from '@/lib/sync/engine';
import { logActivity } from '@/lib/db/activity-logger';
import { formatAmount } from '@/lib/finance/format';

export interface MergePreview {
  sourceName: string;
  targetName: string;
  transactionCount: number;
  balanceToMove: number;
  currency: string;
}

/** Aperçu affiché avant confirmation : ce qui sera déplacé, sans rien modifier. */
export async function previewAccountMerge(sourceAccountId: string, targetAccountId: string): Promise<MergePreview> {
  const [source, target] = await Promise.all([
    db.accounts.get(sourceAccountId),
    db.accounts.get(targetAccountId),
  ]);
  if (!source || !target) throw new Error('Compte introuvable');

  const ownTxCount = await db.transactions.where('account_id').equals(sourceAccountId).filter(t => !t.deleted_at).count();
  // transfer_to_account_id n'est pas indexé (voir dexie.ts) : .filter() sur toute la
  // table plutôt que .where(), acceptable ici car cette action est rare (pas un hot path).
  const incomingTransfersCount = await db.transactions
    .toCollection()
    .filter(t => !t.deleted_at && t.transfer_to_account_id === sourceAccountId && t.account_id !== sourceAccountId)
    .count();

  return {
    sourceName: source.name,
    targetName: target.name,
    transactionCount: ownTxCount + incomingTransfersCount,
    balanceToMove: source.balance,
    currency: source.currency,
  };
}

/**
 * Fusionne un compte dans un autre : tout l'historique (transactions, transferts,
 * récurrences, objectifs liés) est réassigné au compte cible, le solde restant y
 * est ajouté, et le compte source est fermé (suppression douce). Une transaction
 * réassignée hérite de l'espace du compte cible (même règle que sa création,
 * voir createTransaction.ts) ; un transfert dont la source n'était que la
 * destination ne change que sa destination, pas son espace d'origine.
 */
export async function mergeAccountInto(sourceAccountId: string, targetAccountId: string, userId: string): Promise<void> {
  if (sourceAccountId === targetAccountId) throw new Error('Impossible de fusionner un compte avec lui-même');

  const [source, target] = await Promise.all([
    db.accounts.get(sourceAccountId),
    db.accounts.get(targetAccountId),
  ]);
  if (!source || !target) throw new Error('Compte introuvable');

  const now = new Date().toISOString();
  const touchedTransactionIds: string[] = [];
  const touchedRecurringIds: string[] = [];
  const touchedGoalIds: string[] = [];

  await db.transaction('rw', [db.accounts, db.transactions, db.recurringTransactions, db.savingsGoals], async () => {
    const ownTx = await db.transactions.where('account_id').equals(sourceAccountId).toArray();
    for (const t of ownTx) {
      await db.transactions.put({ ...t, account_id: targetAccountId, space_id: target.space_id ?? null, updated_at: now, sync_status: 'pending' });
      touchedTransactionIds.push(t.id);
    }

    const incomingTransfers = await db.transactions
      .toCollection()
      .filter(t => t.transfer_to_account_id === sourceAccountId && t.account_id !== sourceAccountId)
      .toArray();
    for (const t of incomingTransfers) {
      await db.transactions.put({ ...t, transfer_to_account_id: targetAccountId, updated_at: now, sync_status: 'pending' });
      touchedTransactionIds.push(t.id);
    }

    // account_id n'est indexé ni sur recurringTransactions ni sur savingsGoals (voir dexie.ts) :
    // .toCollection().filter() plutôt que .where(), acceptable pour cette action rare.
    const recurring = await db.recurringTransactions.toCollection().filter(r => r.account_id === sourceAccountId).toArray();
    for (const r of recurring) {
      await db.recurringTransactions.put({ ...r, account_id: targetAccountId, updated_at: now, sync_status: 'pending' });
      touchedRecurringIds.push(r.id);
    }

    const goals = await db.savingsGoals.toCollection().filter(g => g.account_id === sourceAccountId).toArray();
    for (const g of goals) {
      await db.savingsGoals.put({ ...g, account_id: targetAccountId, updated_at: now, sync_status: 'pending' });
      touchedGoalIds.push(g.id);
    }

    await db.accounts.update(targetAccountId, { balance: target.balance + source.balance, updated_at: now, sync_status: 'pending' });
    await db.accounts.update(sourceAccountId, { balance: 0, deleted_at: now, updated_at: now, sync_status: 'pending' });
  });

  for (const id of touchedTransactionIds) {
    const t = await db.transactions.get(id);
    if (t) await SyncEngine.queueOperation('transactions', id, 'update', t);
  }
  for (const id of touchedRecurringIds) {
    const r = await db.recurringTransactions.get(id);
    if (r) await SyncEngine.queueOperation('recurring_transactions', id, 'update', r);
  }
  for (const id of touchedGoalIds) {
    const g = await db.savingsGoals.get(id);
    if (g) await SyncEngine.queueOperation('savings_goals', id, 'update', g);
  }
  const finalTarget = await db.accounts.get(targetAccountId);
  const finalSource = await db.accounts.get(sourceAccountId);
  if (finalTarget) await SyncEngine.queueOperation('accounts', targetAccountId, 'update', finalTarget);
  if (finalSource) await SyncEngine.queueOperation('accounts', sourceAccountId, 'delete', finalSource);

  await logActivity({
    user_id: userId,
    entity_type: 'account',
    entity_id: targetAccountId,
    action: 'update',
    old_values: { source: source.name, source_balance: source.balance },
    new_values: { target: target.name, transactions_moved: touchedTransactionIds.length, balance_added: source.balance },
    description: `Compte "${source.name}" fusionné dans "${target.name}" — ${touchedTransactionIds.length} transaction(s) et ${formatAmount(source.balance, source.currency)} transférés`,
  });
}
