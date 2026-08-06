'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { contributeToGoal } from '@/lib/goals/goalActions';
import { InsufficientFundsError } from '@/lib/transactions/createTransaction';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { NumericKeypad } from '@/components/quick-add/NumericKeypad';
import { formatAmount } from '@/lib/finance/format';
import { toast } from 'sonner';
import type { DBSavingsGoal } from '@/types/database';

export function ContributeForm({ goal, onSuccess }: { goal: DBSavingsGoal; onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const allAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  // Comptes de l'espace de CET objectif (pas nécessairement l'espace actif du switcher) :
  // on veut contribuer avec un compte cohérent avec l'objectif, pas avec la vue courante.
  const accounts = filterBySpace(allAccounts, goal.space_id ?? null);
  const [digits, setDigits] = useState('');
  const [accountId, setAccountId] = useState(goal.account_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = digits ? parseInt(digits, 10) : 0;

  const appendDigit = (key: string) => {
    if (key === 'backspace') { setDigits(d => d.slice(0, -1)); return; }
    setDigits(d => (d === '0' ? key : d + key).slice(0, 12));
  };

  const handleSubmit = async () => {
    if (!user || amount <= 0 || !accountId) return;
    setIsSubmitting(true);
    try {
      await contributeToGoal(goal, amount, accountId, user.id);
      toast.success(`${formatAmount(amount, 'GNF')} ajoutés à "${goal.name}"`);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof InsufficientFundsError ? 'Fonds insuffisants' : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <span className="text-4xl font-bold tabular-nums">{digits ? Number(digits).toLocaleString('fr-GN') : '0'}</span>
        <span className="text-lg text-muted-foreground ml-1.5">GNF</span>
      </div>

      <div className="px-2 space-y-2">
        <Label>Depuis quel compte ?</Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
          <SelectContent>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatAmount(acc.balance, acc.currency)})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <NumericKeypad onKey={appendDigit} />

      <div className="px-2 pb-2">
        <Button onClick={handleSubmit} disabled={amount <= 0 || !accountId || isSubmitting} className="w-full" size="lg">
          {isSubmitting ? 'Ajout...' : 'Contribuer'}
        </Button>
      </div>
    </div>
  );
}
