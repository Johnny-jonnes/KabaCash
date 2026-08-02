import type { DBAccount, DBTransaction } from '@/types/database';
import type { CategoryOption } from '@/hooks/useCategories';
import type { TransactionType } from '@/types/enums';

/** Montants les plus fréquemment saisis pour ce type, du plus récent au plus ancien en cas d'égalité. */
export function getRecentAmounts(transactions: DBTransaction[], type: TransactionType, limit = 3): number[] {
  const counts = new Map<number, { count: number; lastUsed: string }>();
  for (const t of transactions) {
    if (t.type !== type || t.deleted_at || t.amount <= 0) continue;
    const entry = counts.get(t.amount);
    if (entry) {
      entry.count++;
      if (t.created_at > entry.lastUsed) entry.lastUsed = t.created_at;
    } else {
      counts.set(t.amount, { count: 1, lastUsed: t.created_at });
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count || (b[1].lastUsed > a[1].lastUsed ? 1 : -1))
    .slice(0, limit)
    .map(([amount]) => amount);
}

/** Catégories triées par fréquence d'usage récente (les plus utilisées en premier). */
export function sortCategoriesByUsage(categories: CategoryOption[], transactions: DBTransaction[]): CategoryOption[] {
  const counts = new Map<string, number>();
  for (const t of transactions) {
    if (t.deleted_at) continue;
    counts.set(t.category_id, (counts.get(t.category_id) || 0) + 1);
  }
  return [...categories].sort((a, b) => (counts.get(b.name) || 0) - (counts.get(a.name) || 0));
}

/** Comptes triés par dernière utilisation (le plus récemment utilisé en premier). */
export function sortAccountsByRecency(accounts: DBAccount[], transactions: DBTransaction[]): DBAccount[] {
  const lastUsed = new Map<string, string>();
  for (const t of transactions) {
    if (t.deleted_at) continue;
    const current = lastUsed.get(t.account_id);
    if (!current || t.created_at > current) lastUsed.set(t.account_id, t.created_at);
  }
  return [...accounts].sort((a, b) => (lastUsed.get(b.id) || '').localeCompare(lastUsed.get(a.id) || ''));
}
