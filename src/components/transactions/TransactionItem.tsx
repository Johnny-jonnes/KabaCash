import { formatAmount } from '@/lib/finance/format';
import { ArrowDownRight, ArrowUpRight, Repeat } from 'lucide-react';

interface TransactionItemProps {
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
}

export function TransactionItem({ title, category, amount, type, date }: TransactionItemProps) {
  const isIncome = type === 'income';
  const isTransfer = type === 'transfer';
  
  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isIncome ? 'bg-emerald-100 text-emerald-600' : 
          isTransfer ? 'bg-blue-100 text-blue-600' : 
          'bg-rose-100 text-rose-600'
        }`}>
          {isIncome ? <ArrowDownRight className="w-5 h-5" /> : 
           isTransfer ? <Repeat className="w-5 h-5" /> : 
           <ArrowUpRight className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-medium text-sm leading-none mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground">{category} • {date}</p>
        </div>
      </div>
      <div className={`font-semibold text-sm ${
        isIncome ? 'text-emerald-600' : 
        isTransfer ? 'text-blue-600' : 
        'text-foreground'
      }`}>
        {isIncome ? '+' : isTransfer ? '' : '-'}{formatAmount(amount, 'GNF')}
      </div>
    </div>
  );
}
