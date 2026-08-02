export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'deleted';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'mobile_money' | 'bank' | 'business';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';
export type CustomDurationUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type CategoryType = 'income' | 'expense';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type UIMode = 'simple' | 'advanced';

// Centre de notifications (Phase 2, 'goal_reached' ajouté en Phase 3 avec les Objectifs).
export type NotificationKind = 'budget_alert' | 'account_alert' | 'forecast' | 'advice' | 'anomaly' | 'new_saving' | 'goal_reached';
export type NotificationTone = 'info' | 'positive' | 'warning' | 'critical';

// Espaces Famille/Entreprise (Phase 4).
export type SpaceType = 'family' | 'business';
export type SpaceRole = 'chef' | 'membre';
