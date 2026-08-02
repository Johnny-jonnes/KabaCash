import {
  startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears,
  differenceInCalendarDays,
} from 'date-fns';

export type PeriodPreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'this_year' | 'last_year' | 'custom';

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  '7d': '7 jours',
  '30d': '30 jours',
  '90d': '90 jours',
  this_year: 'Cette année',
  last_year: 'Année précédente',
  custom: 'Personnalisé',
};

export interface DateRange {
  start: Date;
  end: Date;
}

export function resolvePeriod(preset: PeriodPreset, now: Date, custom?: DateRange): DateRange {
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case '7d':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case '30d':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case '90d':
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
    case 'this_year':
      return { start: startOfYear(now), end: endOfDay(now) };
    case 'last_year': {
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    }
    case 'custom':
      return custom || { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
  }
}

/** Période précédente de même durée, pour la comparaison ("vs période précédente"). */
export function previousPeriod(range: DateRange): DateRange {
  const days = differenceInCalendarDays(range.end, range.start) + 1;
  return { start: subDays(range.start, days), end: subDays(range.end, days) };
}

export function isInRange(dateStr: string, range: DateRange): boolean {
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}
