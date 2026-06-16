import Dexie, { type Table } from 'dexie';
import { DBAccount, DBActivityLog, DBBudget, DBBudgetPeriod, DBCategory, DBRecurringTransaction, DBSyncQueueItem, DBTransaction } from '@/types/database';

export class KabaCashDB extends Dexie {
  accounts!: Table<DBAccount>;
  transactions!: Table<DBTransaction>;
  categories!: Table<DBCategory>;
  budgets!: Table<DBBudget>;
  budgetPeriods!: Table<DBBudgetPeriod>;
  recurringTransactions!: Table<DBRecurringTransaction>;
  activityLogs!: Table<DBActivityLog>;
  syncQueue!: Table<DBSyncQueueItem>;

  constructor() {
    super('KabaCashDB');

    this.version(1).stores({
      accounts: 'id, user_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, account_id, category_id, type, transaction_date, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, sync_status, deleted_at',
      budgets: 'id, user_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
    });

    // Version 2 : ajout de l'index created_at sur transactions
    this.version(2).stores({
      accounts: 'id, user_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, account_id, category_id, type, transaction_date, created_at, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, sync_status, deleted_at',
      budgets: 'id, user_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
    });

    // Version 3 : support des périodes de budget personnalisées
    this.version(3).stores({
      accounts: 'id, user_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, account_id, category_id, type, transaction_date, created_at, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, sync_status, deleted_at',
      budgets: 'id, user_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
    });
  }
}

export const db = new KabaCashDB();
