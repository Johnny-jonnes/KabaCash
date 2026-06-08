'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { Header } from '@/components/layout/Header';
import { AlertTriangle, TrendingDown, CheckCircle2, Info, ChevronDown } from 'lucide-react';
import { calculateBudgetPercentage } from '@/lib/finance/calculations';
import { formatAmount } from '@/lib/finance/format';
import { isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

export default function AlertsPage() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const now = new Date();
  const yearStart = startOfYear(now).toISOString();

  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() =>
    db.transactions
      .where('transaction_date')
      .aboveOrEqual(yearStart)
      .filter(t => t.type === 'expense')
      .toArray()
  ) || [];

  // Pré-calculer les dépenses par catégorie une seule fois (évite N boucles sur les transactions)
  const spentByCategory = useMemo(() => {
    const map: Record<string, { daily: number; weekly: number; monthly: number; annual: number }> = {};
    
    for (const t of transactions) {
      const cat = t.category_id;
      if (!map[cat]) {
        map[cat] = { daily: 0, weekly: 0, monthly: 0, annual: 0 };
      }
      
      const txDate = parseISO(t.transaction_date);
      
      // Annuel : toutes les tx de l'année (déjà filtré par la requête)
      map[cat].annual += t.amount;
      
      if (isSameMonth(txDate, now)) {
        map[cat].monthly += t.amount;
      }
      if (isSameWeek(txDate, now, { weekStartsOn: 1 })) {
        map[cat].weekly += t.amount;
      }
      if (isSameDay(txDate, now)) {
        map[cat].daily += t.amount;
      }
    }
    return map;
  }, [transactions, now]);

  const periodContexts: Record<string, string> = {
    daily: "aujourd'hui",
    weekly: 'cette semaine',
    monthly: 'ce mois-ci',
    annual: 'cette année',
  };

  type Alert = {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    pct: number;
  };

  // Générer les alertes via le cache pré-calculé (O(budgets) au lieu de O(budgets × transactions))
  const alerts = useMemo(() => {
    const result: Alert[] = [];

    for (const budget of budgets) {
      const catSpent = spentByCategory[budget.category_id];
      const spent = catSpent ? catSpent[budget.period_type as keyof typeof catSpent] || 0 : 0;
      const pct = calculateBudgetPercentage(spent, budget.amount_limit);
      const context = periodContexts[budget.period_type] || periodContexts.monthly;

      if (pct >= 100) {
        result.push({
          id: `${budget.id}-over`,
          type: 'critical',
          title: `Budget "${budget.category_id}" dépassé !`,
          message: `Vous avez dépensé ${formatAmount(spent, budget.currency)} ${context} (Limite: ${formatAmount(budget.amount_limit, budget.currency)}).`,
          pct,
        });
      } else if (pct >= 80) {
        result.push({
          id: `${budget.id}-warn`,
          type: 'warning',
          title: `Budget "${budget.category_id}" bientôt épuisé`,
          message: `Vous êtes à ${pct}% de votre budget ${context} (${formatAmount(spent, budget.currency)} / ${formatAmount(budget.amount_limit, budget.currency)}).`,
          pct,
        });
      }
    }

    // Trier : critiques d'abord, puis par pourcentage décroissant
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'critical' ? -1 : 1;
      return b.pct - a.pct;
    });

    return result;
  }, [budgets, spentByCategory]);

  const visibleAlerts = alerts.slice(0, visibleCount);
  const hasMore = visibleCount < alerts.length;

  const iconMap = {
    critical: <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <TrendingDown className="w-5 h-5 text-orange-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgMap = {
    critical: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-orange-500/10 border-orange-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  return (
    <>
      <Header title="Alertes" showBack />
      <div className="p-4 space-y-4">

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="font-semibold text-lg text-foreground">Tout est en ordre !</p>
            <p className="text-sm mt-1 text-center">Aucune alerte pour le moment. Vos budgets sont bien gérés.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{alerts.length} alerte{alerts.length > 1 ? 's' : ''} active{alerts.length > 1 ? 's' : ''}</p>
            <div className="space-y-3">
              {visibleAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-xl border ${bgMap[alert.type]}`}>
                  {iconMap[alert.type]}
                  <div>
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              >
                <ChevronDown className="w-4 h-4" />
                Afficher plus ({alerts.length - visibleCount} restantes)
              </Button>
            )}
          </>
        )}

      </div>
    </>
  );
}
