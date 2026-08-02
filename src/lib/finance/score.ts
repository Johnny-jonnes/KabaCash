import { format, subMonths, startOfMonth } from 'date-fns';
import type { DBAccount, DBBudget, DBRecurringTransaction, DBTransaction } from '@/types/database';
import { calculateBudgetPercentage } from './calculations';

export type FinancialScoreBand = 'excellent' | 'very_good' | 'correct' | 'needs_improvement' | 'critical';

export interface FinancialScoreResult {
  score: number; // 0-100
  band: FinancialScoreBand;
  bandLabel: string;
  factors: {
    savings: number;
    budgetAdherence: number;
    incomeRegularity: number;
    expenseStability: number;
    recurringCoverage: number;
    history: number;
  };
}

const WEIGHTS = {
  savings: 25,
  budgetAdherence: 25,
  incomeRegularity: 15,
  expenseStability: 15,
  recurringCoverage: 10,
  history: 10,
} as const;

const NEUTRAL = 50; // note attribuée à un facteur quand il n'y a pas assez de données pour juger

/** Regroupe un montant signé par mois (clé 'yyyy-MM') sur les MONTHS_WINDOW derniers mois. */
function monthlyTotals(transactions: DBTransaction[], type: 'income' | 'expense', months: number, now: Date): number[] {
  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    buckets.set(format(subMonths(now, i), 'yyyy-MM'), 0);
  }
  for (const t of transactions) {
    if (t.type !== type || t.deleted_at) continue;
    const key = t.transaction_date.slice(0, 7);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + t.amount);
  }
  return Array.from(buckets.values());
}

/** Coefficient de variation (écart-type / moyenne) — plus il est bas, plus la série est régulière. */
function coefficientOfVariation(values: number[]): number | null {
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length < 2) return null;
  const mean = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
  if (mean === 0) return null;
  const variance = nonZero.reduce((sum, v) => sum + (v - mean) ** 2, 0) / nonZero.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Score de santé financière 0-100, entièrement déterministe (aucun LLM — voir AI_RULES.md).
 * Combine épargne, respect des budgets, régularité des revenus/dépenses, couverture des
 * paiements récurrents et profondeur d'historique. Chaque facteur retombe sur une note
 * neutre (50) quand les données sont insuffisantes pour juger, plutôt que de pénaliser
 * un compte encore jeune.
 */
export function calculateFinancialScore(params: {
  accounts: DBAccount[];
  transactions: DBTransaction[];
  budgets: DBBudget[];
  recurringTransactions: DBRecurringTransaction[];
  now?: Date;
}): FinancialScoreResult {
  const now = params.now ?? new Date();
  const activeTx = params.transactions.filter(t => !t.deleted_at);
  const activeBudgets = params.budgets.filter(b => !b.deleted_at);

  // 1. Épargne : (revenus - dépenses) / revenus sur les 3 derniers mois glissants
  const windowStart = startOfMonth(subMonths(now, 2));
  const recentTx = activeTx.filter(t => new Date(t.transaction_date) >= windowStart);
  const recentIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const recentExpense = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = recentIncome > 0
    ? Math.max(0, Math.min(1, (recentIncome - recentExpense) / recentIncome / 0.20)) * 100
    : NEUTRAL;

  // 2. Respect des budgets : moyenne de dépassement sur les budgets actifs
  const budgetAdherence = activeBudgets.length > 0
    ? activeBudgets.reduce((sum, b) => {
        const spent = activeTx
          .filter(t => t.type === 'expense' && t.category_id === b.category_id)
          .reduce((s, t) => s + t.amount, 0);
        const pct = calculateBudgetPercentage(spent, b.amount_limit);
        return sum + Math.max(0, 1 - Math.max(0, pct - 100) / 100);
      }, 0) / activeBudgets.length * 100
    : NEUTRAL;

  // 3 & 4. Régularité des revenus / dépenses sur 6 mois (coefficient de variation)
  const incomeCv = coefficientOfVariation(monthlyTotals(activeTx, 'income', 6, now));
  const incomeRegularity = incomeCv === null ? NEUTRAL : Math.max(0, Math.min(1, 1 - incomeCv)) * 100;

  const expenseCv = coefficientOfVariation(monthlyTotals(activeTx, 'expense', 6, now));
  const expenseStability = expenseCv === null ? NEUTRAL : Math.max(0, Math.min(1, 1 - expenseCv)) * 100;

  // 5. Paiements récurrents suivis : encourage l'organisation sans punir l'absence
  const activeRecurringCount = params.recurringTransactions.filter(r => r.is_active && !r.deleted_at).length;
  const recurringCoverage = 40 + Math.min(activeRecurringCount / 3, 1) * 60;

  // 6. Historique : nombre de mois distincts avec au moins une transaction (plafond 6 mois)
  const monthsWithActivity = new Set(activeTx.map(t => t.transaction_date.slice(0, 7))).size;
  const history = Math.min(monthsWithActivity / 6, 1) * 100;

  const factors = { savings, budgetAdherence, incomeRegularity, expenseStability, recurringCoverage, history };

  const score = Math.round(
    (factors.savings * WEIGHTS.savings +
      factors.budgetAdherence * WEIGHTS.budgetAdherence +
      factors.incomeRegularity * WEIGHTS.incomeRegularity +
      factors.expenseStability * WEIGHTS.expenseStability +
      factors.recurringCoverage * WEIGHTS.recurringCoverage +
      factors.history * WEIGHTS.history) / 100
  );

  return { score, ...bandFor(score), factors };
}

function bandFor(score: number): { band: FinancialScoreBand; bandLabel: string } {
  if (score >= 85) return { band: 'excellent', bandLabel: 'Excellent' };
  if (score >= 70) return { band: 'very_good', bandLabel: 'Très bon' };
  if (score >= 50) return { band: 'correct', bandLabel: 'Correct' };
  if (score >= 30) return { band: 'needs_improvement', bandLabel: 'À améliorer' };
  return { band: 'critical', bandLabel: 'Critique' };
}
