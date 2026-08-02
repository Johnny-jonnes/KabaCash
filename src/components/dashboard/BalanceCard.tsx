'use client';

import { Wallet } from 'lucide-react';
import { formatAmount } from '@/lib/finance/format';

export function BalanceCard({ totalBalance, accountCount, savings }: { totalBalance: number; accountCount: number; savings: number }) {
  return (
    <div className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden transition-transform active:scale-[0.99] duration-150">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 opacity-80" />
          <h2 className="text-sm font-medium opacity-80">Solde Total</h2>
        </div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{formatAmount(totalBalance, 'GNF')}</p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs opacity-70">{accountCount} compte{accountCount !== 1 ? 's' : ''}</p>
          {savings >= 0 ? (
            <span className="text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
              +{formatAmount(savings, 'GNF')} ce mois
            </span>
          ) : (
            <span className="text-xs font-medium bg-black/20 px-2 py-0.5 rounded-full">
              {formatAmount(savings, 'GNF')} ce mois
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
