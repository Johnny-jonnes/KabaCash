import { DBTransaction } from '@/types/database';

/** Calcul du solde d'un compte — somme déterministe */
export function calculateAccountBalance(
  transactions: DBTransaction[],
  accountId: string
): number {
  return transactions
    .filter(t => t.deleted_at === null && t.account_id === accountId)
    .reduce((balance, t) => {
      if (t.type === 'income') return balance + t.amount;
      if (t.type === 'expense') return balance - t.amount;
      if (t.type === 'transfer') {
        if (t.account_id === accountId) return balance - t.amount;
        if (t.transfer_to_account_id === accountId) return balance + t.amount;
      }
      return balance;
    }, 0);
}

/** Calcul du budget consommé — déterministe */
export function calculateBudgetSpent(
  transactions: DBTransaction[],
  categoryId: string,
  startDate: Date,
  endDate: Date
): number {
  return transactions
    .filter(t =>
      t.deleted_at === null &&
      t.category_id === categoryId &&
      t.type === 'expense' &&
      new Date(t.transaction_date) >= startDate &&
      new Date(t.transaction_date) <= endDate
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Pourcentage du budget consommé */
export function calculateBudgetPercentage(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.round((spent / limit) * 100);
}

/** Score de santé financière (0-10) — déterministe */
export function calculateHealthScore(params: {
  budgetAdherence: number;  // % des budgets respectés
  savingsRate: number;      // % revenus épargnés
  debtRatio: number;        // dette / revenu
}): number {
  const { budgetAdherence, savingsRate, debtRatio } = params;
  let score = 0;
  score += Math.min(budgetAdherence / 100, 1) * 4;   // Max 4 points
  score += Math.min(savingsRate / 20, 1) * 3;          // Max 3 points (20%+ = max)
  score += Math.max(1 - debtRatio, 0) * 3;             // Max 3 points
  return Math.round(score * 10) / 10;
}
