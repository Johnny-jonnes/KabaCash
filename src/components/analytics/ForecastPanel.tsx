'use client';

import { formatAmount } from '@/lib/finance/format';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { FinancialForecast } from '@/lib/finance/forecast';

const HORIZON_LABELS: Record<number, string> = { 7: '7 jours', 30: '30 jours', 90: '3 mois', 180: '6 mois', 365: '12 mois' };

export function ForecastPanel({ forecast }: { forecast: FinancialForecast }) {
  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          Basé sur votre rythme moyen des 30 derniers jours : <span className="font-medium text-income">+{formatAmount(Math.round(forecast.dailyAvgIncome), 'GNF')}</span> et{' '}
          <span className="font-medium text-expense">-{formatAmount(Math.round(forecast.dailyAvgExpense), 'GNF')}</span> par jour. Projection linéaire simple, jamais un modèle opaque.
        </p>
      </div>

      <div className="space-y-2">
        {forecast.points.map(point => {
          const isPositive = point.projectedSavings >= 0;
          return (
            <div key={point.daysAhead} className="bg-card border border-border rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{HORIZON_LABELS[point.daysAhead] || `${point.daysAhead} jours`}</span>
                <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-income' : 'text-expense'}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isPositive ? '+' : ''}{formatAmount(point.projectedSavings, 'GNF')}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Solde projeté</p>
                  <p className="text-xs font-semibold tabular-nums">{formatAmount(point.projectedBalance, 'GNF')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Revenus</p>
                  <p className="text-xs font-semibold text-income tabular-nums">{formatAmount(point.projectedIncome, 'GNF')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Dépenses</p>
                  <p className="text-xs font-semibold text-expense tabular-nums">{formatAmount(point.projectedExpense, 'GNF')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
