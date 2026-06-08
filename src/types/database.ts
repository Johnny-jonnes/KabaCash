import { AccountType, BudgetPeriod, CategoryType, RecurrenceFrequency, SyncStatus, TransactionType, UIMode } from './enums';

export interface DBUserProfile {
  id: string;
  full_name: string;
  phone: string;
  preferred_currency: string;
  ui_mode: UIMode;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBAccount {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  operator?: string;       // Mobile Money : orange_money, mtn_momo, etc.
  phone_number?: string;   // Mobile Money : numéro associé
  bank_name?: string;      // Bank : nom de la banque
  account_number?: string; // Bank : 4 derniers chiffres
  description?: string;    // Note libre
  sort_order: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: boolean;
  sort_order: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  transaction_time?: string;
  transfer_to_account_id?: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBBudget {
  id: string;
  user_id: string;
  category_id: string;
  amount_limit: number;
  period_type: BudgetPeriod;
  currency: string;
  alerts_enabled: boolean;
  alert_threshold_percent: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBBudgetPeriod {
  id: string;
  budget_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  spent_amount: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface DBRecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  frequency: RecurrenceFrequency;
  start_date: string;
  next_occurrence: string;
  end_date: string | null;
  is_active: boolean;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBActivityLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: any;
  new_values?: any;
  description: string;
  created_at: string;
}

export interface DBSyncQueueItem {
  localId?: number;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  created_at: string;
  retry_count: number;
  last_error?: string;
}
