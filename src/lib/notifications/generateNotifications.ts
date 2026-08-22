import { db } from '@/lib/db/dexie';
import { subMonths, subWeeks, startOfWeek, startOfMonth } from 'date-fns';
import { calculateFinancialScore } from '@/lib/finance/score';
import { forecastFinances } from '@/lib/finance/forecast';
import { analyzeFinances } from '@/lib/insights/intelligence';
import { generateInsights, type Insight } from '@/lib/insights/generate';
import { generateRecommendations } from '@/lib/insights/recommendations';
import { upsertNotification, resolveStaleNotifications } from '@/lib/notifications/notificationActions';
import type { NotificationKind } from '@/types/enums';

const INSIGHT_KIND_MAP: Record<Insight['kind'], NotificationKind> = {
  budget_risk: 'budget_alert',
  category_spike: 'advice',
  pace: 'advice',
  projection: 'forecast',
  savings_good: 'new_saving',
  account_low: 'account_alert',
  large_txn: 'account_alert',
  account_digest: 'account_digest',
};

const RECOMMENDATION_KIND_MAP: Record<string, NotificationKind> = {
  'category-reduction': 'advice',
  'dominant-category': 'advice',
  'recurring-cost': 'advice',
  'missing-income': 'anomaly',
  'income-down': 'anomaly',
  'unusual-balance': 'anomaly',
  duplicates: 'anomaly',
  'savings-good': 'new_saving',
};

/**
 * Fait tourner l'ensemble des moteurs déterministes (score, prévisions, intelligence,
 * recommandations) et transforme leurs sorties en notifications persistées. `upsertNotification`
 * dédoublonne déjà par (kind, title) non lus : appeler cette fonction plusieurs fois par session
 * ne spamme pas l'utilisateur (voir cahier des charges : "ne jamais envoyer une notification inutile").
 */
export async function generateNotifications(userId: string): Promise<void> {
  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5)).toISOString().split('T')[0];

  const [accounts, budgets, allTransactions] = await Promise.all([
    db.accounts.toArray(),
    db.budgets.toArray(),
    db.transactions.where('transaction_date').aboveOrEqual(sixMonthsAgo).toArray(),
  ]);

  const activeAccounts = accounts.filter(a => !a.deleted_at);
  const activeBudgets = budgets.filter(b => !b.deleted_at);
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString().split('T')[0];
  const threeMonthsStart = startOfMonth(subMonths(now, 2)).toISOString().split('T')[0];

  const monthTransactions = allTransactions.filter(t => t.transaction_date >= monthStart);
  const prevMonthTransactions = allTransactions.filter(t => t.transaction_date >= prevMonthStart && t.transaction_date < monthStart);
  const threeMonthsTransactions = allTransactions.filter(t => t.transaction_date >= threeMonthsStart);

  // Semaine précédente complète (lundi à dimanche) pour le résumé hebdomadaire par compte.
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }).toISOString().split('T')[0];
  const lastWeekTransactions = allTransactions.filter(t => t.transaction_date >= lastWeekStart && t.transaction_date < currentWeekStart);

  const score = calculateFinancialScore({ accounts: activeAccounts, transactions: threeMonthsTransactions, budgets: activeBudgets, recurringTransactions: [], now });
  const forecast = forecastFinances({ accounts: activeAccounts, transactions: allTransactions, now });
  const intelligence = analyzeFinances({ accounts: activeAccounts, allTransactions, now });

  const insights = generateInsights({ accounts: activeAccounts, monthTransactions, prevMonthTransactions, threeMonthsTransactions, lastWeekTransactions, budgets: activeBudgets, now });

  const byCategoryCurrent = new Map<string, number>();
  const byCategoryAvg = new Map<string, number>();
  for (const t of monthTransactions) if (t.type === 'expense') byCategoryCurrent.set(t.category_id, (byCategoryCurrent.get(t.category_id) || 0) + t.amount);
  for (const t of threeMonthsTransactions) if (t.type === 'expense' && t.transaction_date < monthStart) byCategoryAvg.set(t.category_id, (byCategoryAvg.get(t.category_id) || 0) + t.amount);
  const categorySpends = Array.from(byCategoryCurrent.keys()).map(categoryId => ({
    categoryId,
    current: byCategoryCurrent.get(categoryId) || 0,
    average: (byCategoryAvg.get(categoryId) || 0) / 2,
  }));

  const recommendations = generateRecommendations({ intelligence, forecast, score, categorySpends });

  const tasks: Promise<void>[] = [];

  for (const insight of insights) {
    tasks.push(upsertNotification({
      userId, kind: INSIGHT_KIND_MAP[insight.kind], tone: insight.tone,
      title: insight.title, body: insight.body, href: insight.href,
    }));
  }

  for (const rec of recommendations) {
    tasks.push(upsertNotification({
      userId, kind: RECOMMENDATION_KIND_MAP[rec.id] || 'advice', tone: rec.tone,
      title: rec.title, body: rec.body,
    }));
  }

  await Promise.all(tasks);

  // Résout automatiquement toute alerte générée par ce moteur qui ne correspond plus
  // à rien d'actuellement valide (ex: budget repassé sous le seuil, dépenses
  // redevenues normales) — sinon une alerte résolue restait affichée indéfiniment
  // comme si le problème persistait, ce qui rendait le centre d'alertes incohérent
  // avec l'état réel des finances. Couvre tous les types issus des moteurs
  // (insights + recommandations), pas seulement les budgets.
  // Toujours initialiser les kinds possibles à un ensemble vide : sinon, un kind
  // n'ayant PLUS aucune alerte valide ce tour-ci (ex: 0 budget en dépassement alors
  // qu'il y en avait un la dernière fois) ne serait jamais résolu, faute d'entrée.
  const currentTitlesByKind = new Map<NotificationKind, Set<string>>();
  for (const kind of new Set([...Object.values(INSIGHT_KIND_MAP), ...Object.values(RECOMMENDATION_KIND_MAP)])) {
    currentTitlesByKind.set(kind, new Set());
  }
  for (const insight of insights) currentTitlesByKind.get(INSIGHT_KIND_MAP[insight.kind])!.add(insight.title);
  for (const rec of recommendations) currentTitlesByKind.get(RECOMMENDATION_KIND_MAP[rec.id] || 'advice')!.add(rec.title);

  await Promise.all(
    Array.from(currentTitlesByKind.entries()).map(([kind, titles]) => resolveStaleNotifications(userId, kind, titles))
  );
}
