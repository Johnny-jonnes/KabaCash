import { formatAmount } from '@/lib/finance/format';
import { calculateBudgetPercentage } from '@/lib/finance/calculations';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BudgetCardProps {
  categoryName: string;
  spent: number;
  limit: number;
  currency: string;
  periodLabel?: string;
  onPay?: () => void;
  onDelete?: () => void;
}

export function BudgetCard({ categoryName, spent, limit, currency, periodLabel, onPay, onDelete }: BudgetCardProps) {
  const percentage = calculateBudgetPercentage(spent, limit);
  const isCritical = percentage >= 95;
  const isWarning = percentage >= 80 && !isCritical;
  
  return (
    <Card className={`shadow-sm border-border ${isCritical ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {categoryName}
            {isCritical && <AlertCircle className="w-4 h-4 text-destructive" />}
          </h3>
          <div className="flex items-center gap-3">
            {periodLabel && (
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                {periodLabel}
              </span>
            )}
            <span className="text-sm font-medium">{percentage}%</span>
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2.5 mb-3">
          <div 
            className={`h-2.5 rounded-full transition-all ${isCritical ? 'bg-destructive' : isWarning ? 'bg-orange-500' : 'bg-primary'}`} 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Dépensé: <span className="font-medium text-foreground">{formatAmount(spent, currency)}</span></span>
          <span className="text-muted-foreground">Restant: <span className="font-medium text-foreground">{formatAmount(Math.max(limit - spent, 0), currency)}</span></span>
        </div>

        {onPay && (
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={onPay} className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
