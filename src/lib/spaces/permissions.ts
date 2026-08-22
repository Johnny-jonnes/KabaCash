import type { DBSpaceMember } from '@/types/database';

export interface ResolvedSpacePermissions {
  canAddTransaction: boolean;
  canManageBudgets: boolean;
  canInviteMembers: boolean;
  canViewAllAccounts: boolean;
  spendingLimitPerTxn: number | null;
  forbiddenCategories: string[];
}

const UNRESTRICTED: ResolvedSpacePermissions = {
  canAddTransaction: true,
  canManageBudgets: true,
  canInviteMembers: true,
  canViewAllAccounts: true,
  spendingLimitPerTxn: null,
  forbiddenCategories: [],
};

/**
 * Résout les permissions réelles d'un membre : le chef a toujours tous les droits
 * (comme en base — voir migration 00009), un membre sans ligne de permission
 * explicite (ancien membre créé avant cette fonctionnalité) garde le comportement
 * historique (accès complet), et hors d'un espace (mode Personnel) aucune
 * restriction ne s'applique.
 */
export function resolveSpacePermissions(member: DBSpaceMember | null | undefined): ResolvedSpacePermissions {
  if (!member || member.role === 'chef') return UNRESTRICTED;
  return {
    canAddTransaction: member.can_add_transaction ?? true,
    canManageBudgets: member.can_manage_budgets ?? false,
    canInviteMembers: member.can_invite_members ?? false,
    canViewAllAccounts: member.can_view_all_accounts ?? true,
    spendingLimitPerTxn: member.spending_limit_per_txn ?? null,
    forbiddenCategories: member.forbidden_categories ?? [],
  };
}

export function checkTransactionAllowed(
  perms: ResolvedSpacePermissions,
  params: { amount: number; categoryId: string; type: 'income' | 'expense' | 'transfer' }
): { allowed: boolean; reason?: string } {
  if (!perms.canAddTransaction) {
    return { allowed: false, reason: "Vous n'avez pas la permission d'ajouter des transactions dans cet espace." };
  }
  if (params.type === 'expense') {
    if (perms.spendingLimitPerTxn != null && params.amount > perms.spendingLimitPerTxn) {
      return { allowed: false, reason: `Cette dépense dépasse votre limite autorisée par transaction dans cet espace (${perms.spendingLimitPerTxn.toLocaleString('fr-FR')}).` };
    }
    if (perms.forbiddenCategories.includes(params.categoryId)) {
      return { allowed: false, reason: `La catégorie "${params.categoryId}" est restreinte pour vous dans cet espace.` };
    }
  }
  return { allowed: true };
}

/** Ne garde que les comptes créés par l'utilisateur si son droit de tout voir est désactivé. */
export function filterVisibleAccounts<T extends { user_id: string }>(
  accounts: T[],
  perms: ResolvedSpacePermissions,
  userId: string
): T[] {
  if (perms.canViewAllAccounts) return accounts;
  return accounts.filter(a => a.user_id === userId);
}

/** Restreint une liste de lignes liées à un compte (transactions...) aux comptes visibles. */
export function filterByVisibleAccountIds<T extends { account_id: string }>(
  rows: T[],
  visibleAccountIds: Set<string>,
  perms: ResolvedSpacePermissions
): T[] {
  if (perms.canViewAllAccounts) return rows;
  return rows.filter(r => visibleAccountIds.has(r.account_id));
}
