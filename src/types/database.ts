import { AccountType, BudgetPeriod, CategoryType, CustomDurationUnit, NotificationKind, NotificationTone, PlannedEntryStatus, RecurrenceFrequency, SpaceRole, SpaceType, SyncStatus, TransactionType, UIMode } from './enums';

// Espaces Famille/Entreprise (Phase 4). Un compte "personnel" a space_id = null ;
// un compte partagé appartient à UN SEUL espace (jamais plusieurs à la fois).
// Les tables filles (transactions/budgets/savingsGoals) portent aussi leur propre
// space_id, dénormalisé depuis le compte au moment de la création : ça garde les
// policies RLS simples (pas de jointure) et rapides.
export interface DBSpace {
  id: string;
  owner_id: string;
  name: string;
  type: SpaceType;
  invite_code: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBSpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: SpaceRole;
  full_name: string; // dénormalisé : lisible hors-ligne sans jointure sur user_profiles
  joined_at: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// Objectifs (Phase 3). current_amount n'est jamais modifié à la main : il avance
// uniquement via une vraie transaction de contribution (voir lib/goals/goalActions.ts),
// pour que l'argent mis de côté reste réel et traçable, pas juste un chiffre affiché.
export interface DBSavingsGoal {
  id: string;
  user_id: string;
  space_id?: string | null;
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  account_id?: string;
  reached_at?: string | null;
  sort_order: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

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
  space_id?: string | null; // null = compte personnel
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
  low_balance_threshold?: number | null;  // Alerte perso : solde en dessous duquel prévenir (remplace l'heuristique par défaut)
  large_txn_threshold?: number | null;    // Alerte perso : montant à partir duquel une transaction est signalée
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
  is_active: boolean;
  sort_order: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// "Favoris" : modèle de transaction réutilisable en un tap (FAB, dashboard, appui long)
export interface DBTransactionTemplate {
  id: string;
  user_id: string;
  label: string;
  type: TransactionType;
  account_id: string;
  category_id?: string;
  transfer_to_account_id?: string;
  amount?: number;         // absent = montant demandé à chaque utilisation
  description?: string;
  icon?: string;            // absent = hérite de l'icône de la catégorie
  color?: string;           // absent = hérite de la couleur de la catégorie
  sort_order: number;
  use_count: number;
  last_used_at?: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// Planification : entrée future prévue à une date donnée (ex: "Mars : achat semences
// -500 000"), utile pour anticiper des dépenses/revenus saisonniers ou irréguliers
// (gestion agricole, cycle d'entreprise...). account_id est optionnel — on peut
// planifier un montant sans avoir encore décidé quel compte le paiera ; le compte est
// choisi/confirmé au moment de "réaliser" l'entrée (voir lib/planning/planningActions.ts).
export interface DBPlannedEntry {
  id: string;
  user_id: string;
  space_id?: string | null;
  account_id?: string | null;
  category_id: string; // nom de catégorie, cohérent avec le reste de l'app (voir createTransaction.ts)
  type: CategoryType; // 'income' | 'expense' — pas de transfert planifié
  amount: number;
  currency: string;
  description: string;
  planned_date: string; // yyyy-MM-dd
  status: PlannedEntryStatus;
  realized_transaction_id?: string | null;
  sort_order: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBTransaction {
  id: string;
  user_id: string;
  space_id?: string | null; // dénormalisé depuis le compte à la création
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
  space_id?: string | null;
  category_id: string;
  amount_limit: number;
  period_type: BudgetPeriod;
  custom_duration_value?: number;
  custom_duration_unit?: CustomDurationUnit;
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

// Centre de notifications (Phase 2) : persisté, contrairement aux Insight éphémères
// du dashboard (lib/insights/generate.ts) recalculés à chaque visite.
export interface DBNotification {
  id: string;
  user_id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  title: string;
  body: string;
  href?: string;
  read_at?: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
