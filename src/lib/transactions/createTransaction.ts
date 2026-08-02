import { db } from '@/lib/db/dexie';
import { generateUUID } from '@/lib/utils/id';
import { logActivity } from '@/lib/db/activity-logger';
import { SyncEngine } from '@/lib/sync/engine';
import type { DBTransaction } from '@/types/database';
import type { TransactionType } from '@/types/enums';

export class InsufficientFundsError extends Error {
  constructor(public accountBalance: number) {
    super('Fonds insuffisants');
    this.name = 'InsufficientFundsError';
  }
}

export interface TransactionInput {
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number; // entier, jamais un float (finance.md)
  currency: string;
  categoryId?: string; // transfer : absent
  description?: string;
  date: string; // yyyy-MM-dd
  transferToAccountId?: string;
}

/** Effet en solde d'une transaction : une entrée par compte impacté. */
function balanceDeltas(tx: Pick<DBTransaction, 'type' | 'amount' | 'account_id' | 'transfer_to_account_id'>): Array<{ accountId: string; delta: number }> {
  if (tx.type === 'income') return [{ accountId: tx.account_id, delta: tx.amount }];
  if (tx.type === 'expense') return [{ accountId: tx.account_id, delta: -tx.amount }];
  // transfer
  const deltas = [{ accountId: tx.account_id, delta: -tx.amount }];
  if (tx.transfer_to_account_id) deltas.push({ accountId: tx.transfer_to_account_id, delta: tx.amount });
  return deltas;
}

async function applyDeltas(deltas: Array<{ accountId: string; delta: number }>) {
  const touchedAccountIds = new Set<string>();
  for (const { accountId, delta } of deltas) {
    const account = await db.accounts.get(accountId);
    if (!account) continue;
    await db.accounts.update(accountId, { balance: account.balance + delta });
    touchedAccountIds.add(accountId);
  }
  for (const accountId of touchedAccountIds) {
    const account = await db.accounts.get(accountId);
    if (account) await SyncEngine.queueOperation('accounts', accountId, 'update', account);
  }
}

/** Crée une transaction, applique l'effet sur le(s) solde(s), synchronise, journalise. */
export async function createTransaction(input: TransactionInput): Promise<DBTransaction> {
  const account = await db.accounts.get(input.accountId);
  if (!account) throw new Error('Compte introuvable');

  if ((input.type === 'expense' || input.type === 'transfer') && input.amount > account.balance) {
    throw new InsufficientFundsError(account.balance);
  }

  const now = new Date().toISOString();
  const tx: DBTransaction = {
    id: generateUUID(),
    user_id: input.userId,
    // Une transaction hérite de l'espace de son compte (jamais choisi indépendamment) :
    // poster sur un compte partagé rend automatiquement la transaction visible aux
    // autres membres de cet espace.
    space_id: account.space_id ?? null,
    account_id: input.accountId,
    category_id: input.categoryId || '',
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    description: input.description || '',
    transaction_date: input.date,
    sync_status: 'pending',
    created_at: now,
    updated_at: now,
    ...(input.type === 'transfer' && input.transferToAccountId
      ? { transfer_to_account_id: input.transferToAccountId }
      : {}),
  };

  await db.transactions.add(tx);
  await applyDeltas(balanceDeltas(tx));
  await SyncEngine.queueOperation('transactions', tx.id, 'create', tx);
  await logActivity({
    user_id: input.userId,
    entity_type: 'transaction',
    entity_id: tx.id,
    action: 'create',
    new_values: { type: tx.type, amount: tx.amount, category_id: tx.category_id, account_id: tx.account_id },
    description: `${tx.type === 'income' ? 'Revenu' : tx.type === 'expense' ? 'Dépense' : 'Transfert'} de ${tx.amount} ${tx.currency}${tx.category_id ? ` (${tx.category_id})` : ''}`,
  });

  return tx;
}

/** Suppression douce : annule l'effet sur le(s) solde(s), ne supprime jamais la ligne physiquement. */
export async function deleteTransaction(transactionId: string, userId: string): Promise<void> {
  const tx = await db.transactions.get(transactionId);
  if (!tx || tx.deleted_at) return;

  await applyDeltas(balanceDeltas(tx).map(d => ({ accountId: d.accountId, delta: -d.delta })));

  const now = new Date().toISOString();
  const deletedTx: DBTransaction = { ...tx, deleted_at: now, updated_at: now, sync_status: 'pending' };
  await db.transactions.put(deletedTx);
  // Payload complet (pas juste {id, deleted_at}) : l'upsert distant doit rester valide
  // même si la ligne n'a encore jamais été synchronisée (création hors-ligne puis suppression
  // avant la première reconnexion) — voir toRemotePayload dans sync/engine.ts.
  await SyncEngine.queueOperation('transactions', transactionId, 'delete', deletedTx);
  await logActivity({
    user_id: userId,
    entity_type: 'transaction',
    entity_id: transactionId,
    action: 'delete',
    old_values: { type: tx.type, amount: tx.amount, category_id: tx.category_id },
    description: `${tx.type === 'income' ? 'Revenu' : tx.type === 'expense' ? 'Dépense' : 'Transfert'} de ${tx.amount} ${tx.currency} supprimé`,
  });
}

export type TransactionUpdateInput = Partial<Pick<TransactionInput,
  'accountId' | 'type' | 'amount' | 'categoryId' | 'description' | 'date' | 'transferToAccountId'
>>;

/** Modifie une transaction existante : annule l'ancien effet, applique le nouveau, en une seule opération cohérente. */
export async function updateTransaction(transactionId: string, userId: string, updates: TransactionUpdateInput): Promise<DBTransaction> {
  const oldTx = await db.transactions.get(transactionId);
  if (!oldTx || oldTx.deleted_at) throw new Error('Transaction introuvable');

  const newAccountId = updates.accountId ?? oldTx.account_id;
  const newSpaceId = updates.accountId && updates.accountId !== oldTx.account_id
    ? (await db.accounts.get(newAccountId))?.space_id ?? null
    : oldTx.space_id;

  const merged: DBTransaction = {
    ...oldTx,
    space_id: newSpaceId,
    account_id: newAccountId,
    type: updates.type ?? oldTx.type,
    amount: updates.amount ?? oldTx.amount,
    category_id: updates.categoryId ?? oldTx.category_id,
    description: updates.description ?? oldTx.description,
    transaction_date: updates.date ?? oldTx.transaction_date,
    transfer_to_account_id: updates.transferToAccountId ?? oldTx.transfer_to_account_id,
  };

  // Annule l'ancien effet puis vérifie les fonds avant d'appliquer le nouveau
  await applyDeltas(balanceDeltas(oldTx).map(d => ({ accountId: d.accountId, delta: -d.delta })));

  if (merged.type === 'expense' || merged.type === 'transfer') {
    const account = await db.accounts.get(merged.account_id);
    if (!account || merged.amount > account.balance) {
      // Repositionne l'ancien effet avant d'échouer : jamais d'état intermédiaire incohérent
      await applyDeltas(balanceDeltas(oldTx));
      throw new InsufficientFundsError(account?.balance ?? 0);
    }
  }

  await applyDeltas(balanceDeltas(merged));

  const now = new Date().toISOString();
  const finalTx: DBTransaction = { ...merged, updated_at: now, sync_status: 'pending' };
  await db.transactions.put(finalTx);
  await SyncEngine.queueOperation('transactions', transactionId, 'update', finalTx);
  await logActivity({
    user_id: userId,
    entity_type: 'transaction',
    entity_id: transactionId,
    action: 'update',
    old_values: { amount: oldTx.amount, category_id: oldTx.category_id, account_id: oldTx.account_id },
    new_values: { amount: finalTx.amount, category_id: finalTx.category_id, account_id: finalTx.account_id },
    description: `Transaction modifiée`,
  });

  return finalTx;
}
