import { formatAmount } from '@/lib/finance/format';
import { Wallet, Smartphone, Landmark, Briefcase, Trash2, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AccountType } from '@/types/enums';

interface AccountCardProps {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  operator?: string;
  phone_number?: string;
  bank_name?: string;
  onDelete?: () => void;
  onMerge?: () => void;
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

export function AccountCard({ name, type, balance, currency, color, operator, phone_number, bank_name, onDelete, onMerge }: AccountCardProps) {
  const Icon = TYPE_ICONS[type] || Wallet;
  const accentColor = color || '#3B82F6';

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
        <div className="flex items-center">
          {/* Bande de couleur latérale */}
          <div className="w-1.5 self-stretch rounded-l-lg" style={{ backgroundColor: accentColor }} />
          
          <div className="flex items-center justify-between flex-1 p-4">
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{name}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="font-bold text-base tabular-nums">{formatAmount(balance, currency)}</p>
                <p className="text-[10px] text-muted-foreground">{currency}</p>
              </div>
              {onMerge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onMerge();
                  }}
                  title="Transférer vers un autre compte"
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete();
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
