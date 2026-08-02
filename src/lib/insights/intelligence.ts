import { differenceInCalendarDays, getDay, getHours, subMonths, startOfMonth } from 'date-fns';
import type { DBAccount, DBTransaction } from '@/types/database';
import { calculateAccountBalance } from '@/lib/finance/calculations';

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export interface DuplicateGroup {
  transactions: DBTransaction[];
  amount: number;
  categoryId: string;
}

export interface RecurringPattern {
  categoryId: string;
  accountId: string;
  type: 'income' | 'expense';
  averageAmount: number;
  occurrences: number;
  intervalDays: number;
  lastDate: string;
  nextExpectedDate: string;
  label: string;
}

export interface MerchantStat {
  merchant: string;
  count: number;
  totalAmount: number;
}

export interface UnusualBalance {
  accountId: string;
  accountName: string;
  storedBalance: number;
  recalculatedBalance: number;
  deviation: number;
}

export interface FinancialIntelligenceReport {
  duplicates: DuplicateGroup[];
  recurringExpenses: RecurringPattern[];
  recurringIncomes: RecurringPattern[];
  missingIncome: RecurringPattern | null;
  dominantCategory: { categoryId: string; totalAmount: number; percentOfExpenses: number } | null;
  topSpendingDay: { day: string; total: number } | null;
  topSpendingHour: { hour: number; total: number } | null;
  favoriteMerchant: MerchantStat | null;
  mostExpensiveMerchant: MerchantStat | null;
  unusualBalances: UnusualBalance[];
  incomeChange: { direction: 'up' | 'down'; percent: number } | null;
}

/** Transactions dupliquées : même compte, catégorie, montant et jour — signal de double saisie. */
function detectDuplicates(transactions: DBTransaction[]): DuplicateGroup[] {
  const groups = new Map<string, DBTransaction[]>();
  for (const t of transactions) {
    if (t.deleted_at || t.type === 'transfer') continue;
    const key = `${t.account_id}|${t.category_id}|${t.amount}|${t.transaction_date}`;
    const list = groups.get(key) || [];
    list.push(t);
    groups.set(key, list);
  }
  return Array.from(groups.values())
    .filter(list => list.length > 1)
    .map(list => ({ transactions: list, amount: list[0].amount, categoryId: list[0].category_id }));
}

/** Paiements/revenus récurrents : montants similaires (±8%) sur le même compte/catégorie, à intervalle régulier. */
function detectRecurringPatterns(transactions: DBTransaction[], type: 'income' | 'expense'): RecurringPattern[] {
  const groups = new Map<string, DBTransaction[]>();
  for (const t of transactions) {
    if (t.deleted_at || t.type !== type) continue;
    const key = `${t.account_id}|${t.category_id}`;
    const list = groups.get(key) || [];
    list.push(t);
    groups.set(key, list);
  }

  const patterns: RecurringPattern[] = [];
  for (const [key, list] of groups) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
    const avgAmount = sorted.reduce((s, t) => s + t.amount, 0) / sorted.length;
    // Ne garder que les montants proches de la moyenne (tolérance 8%) pour isoler un vrai sous-groupe récurrent
    const consistent = sorted.filter(t => Math.abs(t.amount - avgAmount) / avgAmount <= 0.08);
    if (consistent.length < 3) continue;

    const intervals: number[] = [];
    for (let i = 1; i < consistent.length; i++) {
      intervals.push(differenceInCalendarDays(new Date(consistent[i].transaction_date), new Date(consistent[i - 1].transaction_date)));
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const intervalVariance = intervals.reduce((s, v) => s + (v - avgInterval) ** 2, 0) / intervals.length;
    const intervalCv = Math.sqrt(intervalVariance) / avgInterval;
    if (avgInterval < 5 || intervalCv > 0.35) continue; // trop irrégulier pour être une vraie récurrence

    const [accountId, categoryId] = key.split('|');
    const last = consistent[consistent.length - 1];
    const nextExpected = new Date(last.transaction_date);
    nextExpected.setDate(nextExpected.getDate() + Math.round(avgInterval));

    patterns.push({
      categoryId,
      accountId,
      type,
      averageAmount: Math.round(avgAmount),
      occurrences: consistent.length,
      intervalDays: Math.round(avgInterval),
      lastDate: last.transaction_date,
      nextExpectedDate: nextExpected.toISOString().split('T')[0],
      label: last.description || categoryId,
    });
  }
  return patterns;
}

/** Un revenu récurrent est "manquant" si sa prochaine date attendue est dépassée de plus de 3 jours sans transaction correspondante depuis. */
function detectMissingIncome(recurringIncomes: RecurringPattern[], now: Date): RecurringPattern | null {
  for (const pattern of recurringIncomes) {
    const daysLate = differenceInCalendarDays(now, new Date(pattern.nextExpectedDate));
    if (daysLate > 3) return pattern;
  }
  return null;
}

function normalizeMerchant(description: string): string {
  return description.trim().toLowerCase();
}

function detectMerchantStats(transactions: DBTransaction[]): { favorite: MerchantStat | null; mostExpensive: MerchantStat | null } {
  const stats = new Map<string, { label: string; count: number; totalAmount: number }>();
  for (const t of transactions) {
    if (t.deleted_at || t.type !== 'expense' || !t.description?.trim()) continue;
    const key = normalizeMerchant(t.description);
    const entry = stats.get(key) || { label: t.description.trim(), count: 0, totalAmount: 0 };
    entry.count += 1;
    entry.totalAmount += t.amount;
    stats.set(key, entry);
  }
  const list = Array.from(stats.values()).map(v => ({ merchant: v.label, count: v.count, totalAmount: v.totalAmount }));
  if (list.length === 0) return { favorite: null, mostExpensive: null };
  const favorite = [...list].sort((a, b) => b.count - a.count)[0];
  const mostExpensive = [...list].sort((a, b) => b.totalAmount - a.totalAmount)[0];
  return { favorite, mostExpensive };
}

function detectUnusualBalances(accounts: DBAccount[], allTransactions: DBTransaction[]): UnusualBalance[] {
  const flags: UnusualBalance[] = [];
  for (const account of accounts) {
    if (account.deleted_at) continue;
    const recalculated = calculateAccountBalance(allTransactions, account.id);
    const deviation = Math.abs(account.balance - recalculated);
    // Tolérance : 1% du solde ou 1000 GNF, la plus grande des deux (arrondis / transactions hors fenêtre chargée)
    const tolerance = Math.max(account.balance * 0.01, 1000);
    if (deviation > tolerance) {
      flags.push({ accountId: account.id, accountName: account.name, storedBalance: account.balance, recalculatedBalance: recalculated, deviation });
    }
  }
  return flags;
}

/**
 * Moteur d'intelligence financière (Phase 2) — entièrement déterministe, aucun LLM
 * (voir AI_RULES.md "IA"). Alimente le centre de notifications et les recommandations.
 * `allTransactions` doit couvrir un historique suffisant (recommandé : 6+ mois) pour que
 * la détection de récurrences et l'heure/jour de pointe soient significatives.
 */
export function analyzeFinances(params: {
  accounts: DBAccount[];
  allTransactions: DBTransaction[];
  now?: Date;
}): FinancialIntelligenceReport {
  const now = params.now ?? new Date();
  const active = params.allTransactions.filter(t => !t.deleted_at);
  const expenses = active.filter(t => t.type === 'expense');

  const recurringExpenses = detectRecurringPatterns(active, 'expense');
  const recurringIncomes = detectRecurringPatterns(active, 'income');

  // Catégorie dominante sur les 3 derniers mois
  const windowStart = startOfMonth(subMonths(now, 2));
  const recentExpenses = expenses.filter(t => new Date(t.transaction_date) >= windowStart);
  const totalRecentExpenses = recentExpenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = new Map<string, number>();
  for (const t of recentExpenses) byCategory.set(t.category_id, (byCategory.get(t.category_id) || 0) + t.amount);
  const dominant = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
  const dominantCategory = dominant && totalRecentExpenses > 0
    ? { categoryId: dominant[0], totalAmount: dominant[1], percentOfExpenses: Math.round((dominant[1] / totalRecentExpenses) * 100) }
    : null;

  // Jour/heure de pointe (created_at sert de proxy pour l'heure : transaction_time n'est pas encore saisi dans les formulaires)
  const byDay = new Map<number, number>();
  const byHour = new Map<number, number>();
  for (const t of recentExpenses) {
    const d = new Date(t.transaction_date);
    byDay.set(getDay(d), (byDay.get(getDay(d)) || 0) + t.amount);
    const h = getHours(new Date(t.created_at));
    byHour.set(h, (byHour.get(h) || 0) + t.amount);
  }
  const topDay = Array.from(byDay.entries()).sort((a, b) => b[1] - a[1])[0];
  const topHour = Array.from(byHour.entries()).sort((a, b) => b[1] - a[1])[0];

  const { favorite, mostExpensive } = detectMerchantStats(recentExpenses);

  // Variation de revenu : mois courant vs moyenne des 3 mois précédents
  const currentMonthStart = startOfMonth(now);
  const currentIncome = active.filter(t => t.type === 'income' && new Date(t.transaction_date) >= currentMonthStart).reduce((s, t) => s + t.amount, 0);
  const prevMonthsIncome = active.filter(t => t.type === 'income' && new Date(t.transaction_date) >= windowStart && new Date(t.transaction_date) < currentMonthStart);
  const avgPrevIncome = prevMonthsIncome.length > 0 ? prevMonthsIncome.reduce((s, t) => s + t.amount, 0) / 2 : 0;
  let incomeChange: FinancialIntelligenceReport['incomeChange'] = null;
  if (avgPrevIncome > 0) {
    const ratio = (currentIncome - avgPrevIncome) / avgPrevIncome;
    if (Math.abs(ratio) > 0.25) incomeChange = { direction: ratio > 0 ? 'up' : 'down', percent: Math.round(Math.abs(ratio) * 100) };
  }

  return {
    duplicates: detectDuplicates(active),
    recurringExpenses,
    recurringIncomes,
    missingIncome: detectMissingIncome(recurringIncomes, now),
    dominantCategory,
    topSpendingDay: topDay ? { day: DAY_LABELS[topDay[0]], total: topDay[1] } : null,
    topSpendingHour: topHour ? { hour: topHour[0], total: topHour[1] } : null,
    favoriteMerchant: favorite,
    mostExpensiveMerchant: mostExpensive,
    unusualBalances: detectUnusualBalances(params.accounts, active),
    incomeChange,
  };
}
