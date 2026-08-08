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
  const remaining = Math.max(limit - spent, 0);
  const remainingTone = isCritical ? 'text-status-critical' : isWarning ? 'text-status-warning' : 'text-foreground';

  return (
    <Card className={`shadow-sm border-border ${isCritical ? 'border-status-critical/50 bg-status-critical/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {categoryName}
            {isCritical && <AlertCircle className="w-4 h-4 text-status-critical" />}
          </h3>
          <div className="flex items-center gap-3">
            {periodLabel && (
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                {periodLabel}
              </span>
            )}
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

        {/* Montant restant en décompte : c'est le chiffre qu'on veut voir en premier,
            pas le % consommé — on part d'un montant connu au départ et on regarde
            ce qu'il en reste au fur et à mesure que les dépenses se déduisent. */}
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Restant</p>
            <p className={`text-2xl font-bold tabular-nums ${remainingTone}`}>{formatAmount(remaining, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Départ</p>
            <p className="text-sm font-semibold tabular-nums text-muted-foreground">{formatAmount(limit, currency)}</p>
          </div>
        </div>

        <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full transition-all ${isCritical ? 'bg-status-critical' : isWarning ? 'bg-status-warning' : 'bg-primary'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>

        <p className="text-xs text-muted-foreground">
          {formatAmount(spent, currency)} dépensés · {percentage}%
        </p>

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
