import Dexie, { type Table } from 'dexie';
import { DBAccount, DBActivityLog, DBBudget, DBBudgetPeriod, DBCategory, DBNotification, DBRecurringTransaction, DBSavingsGoal, DBSpace, DBSpaceMember, DBSyncQueueItem, DBTransaction, DBTransactionTemplate } from '@/types/database';

export class KabaCashDB extends Dexie {
  accounts!: Table<DBAccount>;
  transactions!: Table<DBTransaction>;
  categories!: Table<DBCategory>;
  budgets!: Table<DBBudget>;
  budgetPeriods!: Table<DBBudgetPeriod>;
  recurringTransactions!: Table<DBRecurringTransaction>;
  activityLogs!: Table<DBActivityLog>;
  syncQueue!: Table<DBSyncQueueItem>;
  transactionTemplates!: Table<DBTransactionTemplate>;
  notifications!: Table<DBNotification>;
  savingsGoals!: Table<DBSavingsGoal>;
  spaces!: Table<DBSpace>;
  spaceMembers!: Table<DBSpaceMember>;

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

    // Version 4 : catégories désactivables + favoris (modèles de transaction)
    this.version(4).stores({
      accounts: 'id, user_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, account_id, category_id, type, transaction_date, created_at, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, is_active, sync_status, deleted_at',
      budgets: 'id, user_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
      transactionTemplates: 'id, user_id, sort_order, use_count, sync_status, deleted_at',
    }).upgrade(async (tx) => {
      // Les catégories existantes n'ont pas encore is_active : elles restent actives par défaut.
      await tx.table('categories').toCollection().modify((cat) => {
        if (cat.is_active === undefined) cat.is_active = true;
      });
    });

    // Version 5 : centre de notifications persistant (Phase 2)
    this.version(5).stores({
      accounts: 'id, user_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, account_id, category_id, type, transaction_date, created_at, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, is_active, sync_status, deleted_at',
      budgets: 'id, user_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
      transactionTemplates: 'id, user_id, sort_order, use_count, sync_status, deleted_at',
      notifications: 'id, user_id, kind, read_at, created_at, sync_status, deleted_at',
    });

    // Version 6 : Objectifs d'épargne (Phase 3)
    this.version(6).stores({
      accounts: 'id, user_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, account_id, category_id, type, transaction_date, created_at, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, is_active, sync_status, deleted_at',
      budgets: 'id, user_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
      transactionTemplates: 'id, user_id, sort_order, use_count, sync_status, deleted_at',
      notifications: 'id, user_id, kind, read_at, created_at, sync_status, deleted_at',
      savingsGoals: 'id, user_id, target_date, sort_order, sync_status, deleted_at',
    });

    // Version 7 : Espaces Famille/Entreprise (Phase 4)
    this.version(7).stores({
      accounts: 'id, user_id, space_id, type, sync_status, deleted_at',
      transactions: 'id, user_id, space_id, account_id, category_id, type, transaction_date, created_at, sync_status, deleted_at',
      categories: 'id, user_id, type, is_default, is_active, sync_status, deleted_at',
      budgets: 'id, user_id, space_id, category_id, period_type, sync_status, deleted_at',
      budgetPeriods: 'id, budget_id, user_id, start_date, end_date, sync_status',
      recurringTransactions: 'id, user_id, next_occurrence, is_active, sync_status, deleted_at',
      activityLogs: 'id, user_id, entity_type, entity_id, created_at',
      syncQueue: '++localId, entity_type, entity_id, operation, created_at',
      transactionTemplates: 'id, user_id, sort_order, use_count, sync_status, deleted_at',
      notifications: 'id, user_id, kind, read_at, created_at, sync_status, deleted_at',
      savingsGoals: 'id, user_id, space_id, target_date, sort_order, sync_status, deleted_at',
      spaces: 'id, owner_id, invite_code, sync_status, deleted_at',
      spaceMembers: 'id, space_id, user_id, role, sync_status, deleted_at',
    });
  }
}

export const db = new KabaCashDB();
