import { formatAmount } from '@/lib/finance/format';
import { Wallet, Smartphone, Landmark, Briefcase, Trash2, ArrowRightLeft, ArrowUp, ArrowDown, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AccountType } from '@/types/enums';

interface AccountCardProps {
  name: string;
  type: AccountType;
  balance: number;
  /** Solde de ce compte au tout début du mois en cours — permet d'afficher le même
   * repère "point de départ" que les budgets (voir BudgetCard), pour suivre le solde
   * qui évolue au fil des transactions plutôt qu'un seul chiffre isolé. */
  monthStartBalance?: number;
  currency: string;
  color?: string;
  operator?: string;
  phone_number?: string;
  bank_name?: string;
  onDelete?: () => void;
  onMerge?: () => void;
  onAlertSettings?: () => void;
}

const TYPE_ICONS = {
  mobile_money: Smartphone,
  cash: Wallet,
  bank: Landmark,
  business: Briefcase,
};

const TYPE_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  cash: 'Espèces',
  bank: 'Compte Bancaire',
  business: 'Compte Pro',
};

export function AccountCard({ name, type, balance, monthStartBalance, currency, color, operator, phone_number, bank_name, onDelete, onMerge, onAlertSettings }: AccountCardProps) {
  const Icon = TYPE_ICONS[type] || Wallet;
  const accentColor = color || '#3B82F6';
  const hasMonthRef = monthStartBalance !== undefined && monthStartBalance !== balance;
  const delta = hasMonthRef ? balance - (monthStartBalance as number) : 0;

  // Sous-titre contextuel
  let subtitle = TYPE_LABELS[type] || type;
  if (type === 'mobile_money' && phone_number) {
    subtitle = phone_number;
  } else if (type === 'bank' && bank_name) {
    subtitle = bank_name;
  }

  return (
    <Card className="shadow-sm border-border overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="w-full h-1.5" style={{ backgroundColor: accentColor }} />
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="p-2.5 rounded-xl shrink-0"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onAlertSettings && (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAlertSettings(); }}
                  title="Régler les alertes de ce compte"
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <BellRing className="w-4 h-4" />
                </button>
              )}
              {onMerge && (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMerge(); }}
                  title="Transférer vers un autre compte"
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(); }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Solde actuel en avant, avec le point de départ du mois toujours visible à
              côté — même principe de lecture que les budgets (Restant / Départ) : un
              montant connu au départ, et l'évolution réelle qui se voit d'un coup d'œil. */}
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Solde actuel</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatAmount(balance, currency)}</p>
            </div>
            {hasMonthRef && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">Début du mois</p>
                <p className="text-sm font-semibold tabular-nums text-muted-foreground">{formatAmount(monthStartBalance as number, currency)}</p>
              </div>
            )}
          </div>

          {hasMonthRef && (
            <p className={`flex items-center gap-1 text-xs mt-2 ${delta >= 0 ? 'text-income' : 'text-expense'}`}>
              {delta >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {formatAmount(Math.abs(delta), currency)} ce mois-ci
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
