import { getDate, getDaysInMonth } from 'date-fns';
import type { DBAccount, DBBudget, DBTransaction } from '@/types/database';
import { calculateBudgetPercentage } from '@/lib/finance/calculations';
import { formatAmount } from '@/lib/finance/format';

export type InsightTone = 'positive' | 'info' | 'warning' | 'critical';
export type InsightKind = 'budget_risk' | 'category_spike' | 'pace' | 'projection' | 'savings_good' | 'account_low';

export interface Insight {
  id: string;
  kind: InsightKind;
  tone: InsightTone;
  title: string;
  body: string;
  href?: string;
}

const TONE_PRIORITY: Record<InsightTone, number> = { critical: 0, warning: 1, positive: 2, info: 3 };

/**
 * Génère un petit nombre d'observations déterministes à partir des données déjà
 * chargées par le dashboard (aucun LLM — voir AI_RULES.md "IA"). Version légère de
 * la Phase 1 : quelques règles à seuil fixe. La détection d'anomalies/récurrences/
 * commerçants plus avancée est prévue pour le moteur d'intelligence de la Phase 2.
 */
export function generateInsights(params: {
  accounts: DBAccount[];
  monthTransactions: DBTransaction[];
  prevMonthTransactions: DBTransaction[];
  threeMonthsTransactions: DBTransaction[]; // pour la moyenne par catégorie
  budgets: DBBudget[];
  now?: Date;
}): Insight[] {
  const { accounts, monthTransactions, prevMonthTransactions, threeMonthsTransactions, budgets } = params;
  const now = params.now ?? new Date();
  const insights: Insight[] = [];

  const expenseOf = (txs: DBTransaction[]) => txs.filter(t => t.type === 'expense' && !t.deleted_at).reduce((s, t) => s + t.amount, 0);
  const incomeOf = (txs: DBTransaction[]) => txs.filter(t => t.type === 'income' && !t.deleted_at).reduce((s, t) => s + t.amount, 0);

  // 1. Budgets en risque de dépassement (le plus critique d'abord)
  for (const budget of budgets.filter(b => !b.deleted_at && b.alerts_enabled)) {
    const spent = monthTransactions
      .filter(t => t.type === 'expense' && !t.deleted_at && t.category_id === budget.category_id)
      .reduce((s, t) => s + t.amount, 0);
    const pct = calculateBudgetPercentage(spent, budget.amount_limit);
    if (pct >= 100) {
      insights.push({
        id: `budget_risk_${budget.id}`,
        kind: 'budget_risk',
        tone: 'critical',
        title: `Budget "${budget.category_id}" dépassé`,
        body: `${formatAmount(spent, budget.currency)} dépensés pour une limite de ${formatAmount(budget.amount_limit, budget.currency)} (${pct}%).`,
        href: '/budgets',
      });
    } else if (pct >= (budget.alert_threshold_percent || 80)) {
      insights.push({
        id: `budget_risk_${budget.id}`,
        kind: 'budget_risk',
        tone: 'warning',
        title: `Budget "${budget.category_id}" bientôt atteint`,
        body: `Déjà ${pct}% utilisé (${formatAmount(spent, budget.currency)} / ${formatAmount(budget.amount_limit, budget.currency)}).`,
        href: '/budgets',
      });
    }
  }

  // 2. Catégorie dont la dépense ce mois-ci dépasse nettement sa moyenne des 3 derniers mois
  const monthKey = (t: DBTransaction) => t.transaction_date.slice(0, 7);
  const currentMonthKey = now.toISOString().slice(0, 7);
  const byCategoryThisMonth = new Map<string, number>();
  for (const t of monthTransactions) {
    if (t.type !== 'expense' || t.deleted_at) continue;
    byCategoryThisMonth.set(t.category_id, (byCategoryThisMonth.get(t.category_id) || 0) + t.amount);
  }
  const byCategory3mo = new Map<string, number>();
  for (const t of threeMonthsTransactions) {
    if (t.type !== 'expense' || t.deleted_at || monthKey(t) === currentMonthKey) continue;
    byCategory3mo.set(t.category_id, (byCategory3mo.get(t.category_id) || 0) + t.amount);
  }
  let topSpike: { category: string; current: number; avg: number; ratio: number } | null = null;
  for (const [category, current] of byCategoryThisMonth) {
    const avg = (byCategory3mo.get(category) || 0) / 3;
    if (avg < 20000 || current < 30000) continue; // ignore les montants négligeables (bruit)
    const ratio = (current - avg) / avg;
    if (ratio > 0.3 && (!topSpike || ratio > topSpike.ratio)) {
      topSpike = { category, current, avg, ratio };
    }
  }
  if (topSpike) {
    insights.push({
      id: `category_spike_${topSpike.category}`,
      kind: 'category_spike',
      tone: 'warning',
      title: `Hausse en "${topSpike.category}"`,
      body: `Vous avez dépensé ${Math.round(topSpike.ratio * 100)}% de plus que d'habitude dans cette catégorie ce mois-ci.`,
      href: '/transactions',
    });
  }

  // 3. Rythme de dépense vs mois dernier, ramené au même nombre de jours écoulés
  const dayOfMonth = getDate(now);
  const daysInMonth = getDaysInMonth(now);
  const prevMonthExpenseToDate = expenseOf(prevMonthTransactions.filter(t => getDate(new Date(t.transaction_date)) <= dayOfMonth));
  const currentExpenseToDate = expenseOf(monthTransactions);
  if (prevMonthExpenseToDate > 50000 && dayOfMonth >= 5) {
    const paceRatio = (currentExpenseToDate - prevMonthExpenseToDate) / prevMonthExpenseToDate;
    if (paceRatio > 0.25) {
      insights.push({
        id: 'pace_up',
        kind: 'pace',
        tone: 'warning',
        title: 'Rythme de dépense plus élevé',
        body: `À ce stade du mois, vous avez dépensé ${Math.round(paceRatio * 100)}% de plus qu'à la même date le mois dernier.`,
      });
    }
  }

  // 4. Projection simple de fin de mois (extrapolation linéaire du rythme actuel)
  if (dayOfMonth >= 3 && currentExpenseToDate > 0) {
    const projectedExpense = Math.round((currentExpenseToDate / dayOfMonth) * daysInMonth);
    const projectedIncome = incomeOf(monthTransactions); // le revenu n'est pas extrapolé : généralement déjà connu/fixe
    const projectedSavings = projectedIncome - projectedExpense;
    if (projectedIncome > 0) {
      insights.push({
        id: 'projection_eom',
        kind: 'projection',
        tone: projectedSavings >= 0 ? 'positive' : 'critical',
        title: projectedSavings >= 0 ? 'Bonne trajectoire ce mois-ci' : 'Risque de dépassement en fin de mois',
        body: projectedSavings >= 0
          ? `Au rythme actuel, vous économiserez environ ${formatAmount(projectedSavings, 'GNF')} ce mois-ci.`
          : `Au rythme actuel, vous dépasserez vos revenus d'environ ${formatAmount(Math.abs(projectedSavings), 'GNF')} ce mois-ci.`,
      });
    }
  }

  // 5. Compte presque vide (solde bas comparé à sa dépense mensuelle moyenne)
  for (const account of accounts) {
    if (account.deleted_at || account.balance <= 0) continue;
    const avgMonthlyOutflow = expenseOf(threeMonthsTransactions.filter(t => t.account_id === account.id)) / 3;
    if (avgMonthlyOutflow > 0 && account.balance < avgMonthlyOutflow * 0.1) {
      insights.push({
        id: `account_low_${account.id}`,
        kind: 'account_low',
        tone: 'warning',
        title: `Compte "${account.name}" presque vide`,
        body: `Solde actuel : ${formatAmount(account.balance, account.currency)}, bien en dessous de votre dépense mensuelle habituelle sur ce compte.`,
        href: '/accounts',
      });
      break; // un seul suffit pour ne pas noyer le dashboard
    }
  }

  return insights.sort((a, b) => TONE_PRIORITY[a.tone] - TONE_PRIORITY[b.tone]);
}
