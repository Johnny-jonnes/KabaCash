import { getDate, getDaysInMonth, startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DBAccount, DBBudget, DBTransaction } from '@/types/database';
import { calculateBudgetPercentage } from '@/lib/finance/calculations';
import { formatAmount } from '@/lib/finance/format';

export type InsightTone = 'positive' | 'info' | 'warning' | 'critical';
export type InsightKind = 'budget_risk' | 'category_spike' | 'pace' | 'projection' | 'savings_good' | 'account_low' | 'large_txn' | 'account_digest';

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
  lastWeekTransactions?: DBTransaction[]; // pour le résumé hebdomadaire par compte
  budgets: DBBudget[];
  now?: Date;
}): Insight[] {
  const { accounts, monthTransactions, prevMonthTransactions, threeMonthsTransactions, lastWeekTransactions, budgets } = params;
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
    // Titre stable quel que soit le niveau de gravité (contrairement à avant, qui
    // variait "bientôt atteint" -> "dépassé") : upsertNotification dédoublonne par
    // (kind, titre), donc un titre stable fait évoluer LA MÊME alerte quand elle
    // s'aggrave, au lieu d'empiler deux alertes distinctes pour un seul problème.
    const title = `Budget "${budget.category_id}"`;
    if (pct >= 100) {
      insights.push({
        id: `budget_risk_${budget.id}`,
        kind: 'budget_risk',
        tone: 'critical',
        title,
        body: `Dépassé : ${formatAmount(spent, budget.currency)} dépensés pour une limite de ${formatAmount(budget.amount_limit, budget.currency)} (${pct}%).`,
        href: '/budgets',
      });
    } else if (pct >= (budget.alert_threshold_percent || 80)) {
      insights.push({
        id: `budget_risk_${budget.id}`,
        kind: 'budget_risk',
        tone: 'warning',
        title,
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

  // 4. Projection simple de fin de mois (extrapolation linéaire du rythme actuel).
  // Le revenu n'est JAMAIS extrapolé, seulement comparé à ce qui est déjà reçu : pour
  // un revenu qui arrive progressivement dans le mois (ventes, prestations — le cas
  // courant pour un commerce ou une exploitation agricole), extrapoler l'aurait fait
  // apparaître comme "manquant" avant même d'être arrivé, et déclenché une fausse
  // alerte de déficit. Un déficit déjà réel (dépenses > revenus reçus à ce jour) reste
  // affirmé sans réserve ; un déficit seulement projeté est formulé avec la réserve
  // explicite qu'un revenu restant peut encore arriver.
  if (dayOfMonth >= 3 && currentExpenseToDate > 0) {
    const projectedExpense = Math.round((currentExpenseToDate / dayOfMonth) * daysInMonth);
    const incomeToDate = incomeOf(monthTransactions);
    if (incomeToDate > 0) {
      const currentSavings = incomeToDate - currentExpenseToDate;
      const projectedSavings = incomeToDate - projectedExpense;
      if (currentSavings < 0) {
        insights.push({
          id: 'projection_eom',
          kind: 'projection',
          tone: 'critical',
          title: 'Dépenses déjà supérieures aux revenus reçus',
          body: `Ce mois-ci : ${formatAmount(currentExpenseToDate, 'GNF')} dépensés pour ${formatAmount(incomeToDate, 'GNF')} reçus jusqu'à présent (déficit de ${formatAmount(Math.abs(currentSavings), 'GNF')}).`,
        });
      } else if (projectedSavings < 0) {
        insights.push({
          id: 'projection_eom',
          kind: 'projection',
          tone: 'warning',
          title: 'Rythme de dépense à surveiller',
          body: `Au rythme actuel, vos dépenses (~${formatAmount(projectedExpense, 'GNF')} en fin de mois) dépasseraient vos revenus déjà reçus (${formatAmount(incomeToDate, 'GNF')}) — sauf si d'autres revenus sont encore attendus.`,
        });
      } else {
        insights.push({
          id: 'projection_eom',
          kind: 'projection',
          tone: 'positive',
          title: 'Bonne trajectoire ce mois-ci',
          body: `Au rythme actuel, vous économiserez environ ${formatAmount(projectedSavings, 'GNF')} ce mois-ci (sur la base des revenus déjà reçus).`,
        });
      }
    }
  }

  // 5. Compte presque vide — seuil personnalisé par compte si défini (voir
  // AccountAlertSettingsDialog), sinon heuristique par défaut (10% de la dépense
  // mensuelle moyenne sur ce compte).
  let heuristicLowBalanceUsed = false;
  for (const account of accounts) {
    if (account.deleted_at || account.balance < 0) continue;
    const hasCustomThreshold = account.low_balance_threshold != null && account.low_balance_threshold > 0;

    if (hasCustomThreshold) {
      if (account.balance < (account.low_balance_threshold as number)) {
        insights.push({
          id: `account_low_${account.id}`,
          kind: 'account_low',
          tone: 'warning',
          title: `Compte "${account.name}" sous le seuil défini`,
          body: `Solde actuel : ${formatAmount(account.balance, account.currency)}, sous le seuil d'alerte de ${formatAmount(account.low_balance_threshold as number, account.currency)} que vous avez défini pour ce compte.`,
          href: '/accounts',
        });
      }
      continue;
    }

    if (heuristicLowBalanceUsed || account.balance <= 0) continue;
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
      heuristicLowBalanceUsed = true; // un seul suffit pour ne pas noyer le dashboard
    }
  }

  // 6. Grosse transaction — uniquement sur les comptes ayant un seuil personnalisé.
  const accountsByIdForLargeTxn = new Map(accounts.filter(a => a.large_txn_threshold != null && (a.large_txn_threshold as number) > 0).map(a => [a.id, a]));
  if (accountsByIdForLargeTxn.size > 0) {
    for (const t of monthTransactions) {
      if (t.deleted_at || t.type === 'transfer') continue;
      const account = accountsByIdForLargeTxn.get(t.account_id);
      if (!account) continue;
      const threshold = account.large_txn_threshold as number;
      if (t.amount >= threshold) {
        insights.push({
          id: `large_txn_${t.id}`,
          kind: 'large_txn',
          tone: 'info',
          title: `Grosse transaction sur "${account.name}"`,
          body: `${t.type === 'income' ? 'Entrée' : 'Sortie'} de ${formatAmount(t.amount, account.currency)}${t.description ? ` (${t.description})` : ''}, au-dessus du seuil de ${formatAmount(threshold, account.currency)} défini pour ce compte.`,
          href: '/transactions',
        });
      }
    }
  }

  // 7. Résumé hebdomadaire par compte — sur la semaine précédente complète (lundi à
  // dimanche), pour rester stable toute la semaine (voir dédoublonnage par titre dans
  // notificationActions.ts) et ne changer qu'au passage à la semaine suivante.
  if (lastWeekTransactions && lastWeekTransactions.length > 0) {
    const weekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const weekLabel = `${format(weekStart, 'd MMM', { locale: fr })} au ${format(weekEnd, 'd MMM', { locale: fr })}`;

    for (const account of accounts) {
      if (account.deleted_at) continue;
      const accountTxs = lastWeekTransactions.filter(t => t.account_id === account.id && !t.deleted_at && t.type !== 'transfer');
      if (accountTxs.length === 0) continue;
      const income = incomeOf(accountTxs);
      const expense = expenseOf(accountTxs);
      const net = income - expense;
      insights.push({
        id: `account_digest_${account.id}`,
        kind: 'account_digest',
        tone: 'info',
        title: `Résumé de la semaine — "${account.name}"`,
        body: `Semaine du ${weekLabel} : ${formatAmount(income, account.currency)} reçus, ${formatAmount(expense, account.currency)} dépensés (${net >= 0 ? '+' : ''}${formatAmount(net, account.currency)} net), solde actuel ${formatAmount(account.balance, account.currency)}.`,
        href: '/accounts',
      });
    }
  }

  return insights.sort((a, b) => TONE_PRIORITY[a.tone] - TONE_PRIORITY[b.tone]);
}
