import { format, getDay, getHours, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DBAccount, DBTransaction } from '@/types/database';
import type { CategoryOption } from '@/hooks/useCategories';
import type { DateRange } from '@/lib/analytics/period';

export type CategoricalDimension = 'category' | 'account' | 'merchant' | 'paymentMethod';
export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type TxType = 'expense' | 'income';

export const DIMENSION_LABELS: Record<CategoricalDimension, string> = {
  category: 'Catégorie', account: 'Compte', merchant: 'Commerçant', paymentMethod: 'Moyen de paiement',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Espèces', mobile_money: 'Mobile Money', bank: 'Banque', business: 'Compte Pro',
};

export interface CategoricalBucket {
  key: string;
  label: string;
  value: number;
  count: number;
  color?: string;
}

export function aggregateByCategoricalDimension(
  transactions: DBTransaction[],
  accounts: DBAccount[],
  categories: CategoryOption[],
  dimension: CategoricalDimension,
  type: TxType,
): CategoricalBucket[] {
  const buckets = new Map<string, CategoricalBucket>();
  const accountById = new Map(accounts.map(a => [a.id, a]));
  const categoryByName = new Map(categories.map(c => [c.name, c]));

  for (const t of transactions) {
    if (t.deleted_at || t.type !== type) continue;

    let key: string; let label: string; let color: string | undefined;
    switch (dimension) {
      case 'category': {
        key = t.category_id || 'Autre';
        label = key;
        color = categoryByName.get(key)?.color;
        break;
      }
      case 'account': {
        const acc = accountById.get(t.account_id);
        key = t.account_id;
        label = acc?.name || 'Compte supprimé';
        color = acc?.color;
        break;
      }
      case 'merchant': {
        const desc = t.description?.trim();
        if (!desc) continue;
        key = desc.toLowerCase();
        label = desc;
        break;
      }
      case 'paymentMethod': {
        const acc = accountById.get(t.account_id);
        key = acc?.type || 'inconnu';
        label = ACCOUNT_TYPE_LABELS[key] || key;
        break;
      }
    }

    const bucket = buckets.get(key) || { key, label, value: 0, count: 0, color };
    bucket.value += t.amount;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) => b.value - a.value);
}

export interface TimeBucket {
  key: string;
  label: string;
  expense: number;
  income: number;
}

function bucketKey(date: Date, granularity: TimeGranularity): { key: string; label: string } {
  switch (granularity) {
    case 'day':
      return { key: format(date, 'yyyy-MM-dd'), label: format(date, 'd MMM', { locale: fr }) };
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return { key: format(start, 'yyyy-MM-dd'), label: `Sem. ${format(start, 'd MMM', { locale: fr })}` };
    }
    case 'month': {
      const start = startOfMonth(date);
      return { key: format(start, 'yyyy-MM'), label: format(start, 'MMM yyyy', { locale: fr }) };
    }
    case 'quarter': {
      const start = startOfQuarter(date);
      return { key: format(start, 'yyyy-MM'), label: `T${Math.floor(date.getMonth() / 3) + 1} ${format(start, 'yyyy')}` };
    }
    case 'year': {
      const start = startOfYear(date);
      return { key: format(start, 'yyyy'), label: format(start, 'yyyy') };
    }
  }
}

/** Agrège revenus/dépenses par bucket temporel, en couvrant tous les buckets de la période (même à 0). */
export function aggregateByTime(transactions: DBTransaction[], granularity: TimeGranularity, range: DateRange): TimeBucket[] {
  const buckets = new Map<string, TimeBucket>();

  // Pré-remplir tous les buckets de la période pour un axe temporel continu
  const step = { day: 1, week: 7, month: 30, quarter: 91, year: 365 }[granularity];
  for (let d = new Date(range.start); d <= range.end; d.setDate(d.getDate() + step)) {
    const { key, label } = bucketKey(d, granularity);
    if (!buckets.has(key)) buckets.set(key, { key, label, expense: 0, income: 0 });
  }

  for (const t of transactions) {
    if (t.deleted_at || t.type === 'transfer') continue;
    const { key, label } = bucketKey(new Date(t.transaction_date), granularity);
    const bucket = buckets.get(key) || { key, label, expense: 0, income: 0 };
    if (t.type === 'expense') bucket.expense += t.amount;
    else bucket.income += t.amount;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}

/** Matrice jour de semaine (0=dimanche..6=samedi) x heure (0-23), montants de dépenses. */
export function aggregateDayHourMatrix(transactions: DBTransaction[]): number[][] {
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const t of transactions) {
    if (t.deleted_at || t.type !== 'expense') continue;
    const day = getDay(new Date(t.transaction_date));
    // created_at sert de proxy pour l'heure : transaction_time n'est pas encore saisi dans les formulaires
    const hour = getHours(new Date(t.created_at));
    matrix[day][hour] += t.amount;
  }
  return matrix;
}
