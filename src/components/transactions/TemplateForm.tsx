'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { useCategories } from '@/hooks/useCategories';
import { createTemplate } from '@/lib/transactions/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { toast } from 'sonner';
import type { TransactionType } from '@/types/enums';

export function TemplateForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const allAccounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const accounts = filterBySpace(allAccounts, activeSpaceId);
  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useCategories(type === 'transfer' ? undefined : type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId) {
      toast.error('Choisissez un compte');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      toast.error('Choisissez une catégorie');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTemplate({
        userId: user.id,
        label: label.trim() || categoryId || 'Favori',
        type,
        accountId,
        categoryId: type === 'transfer' ? undefined : categoryId,
        amount: amount ? parseInt(amount, 10) : undefined,
      });
      toast.success('Favori créé');
      onSuccess?.();
    } catch (error) {
      console.error('Erreur création favori', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(['expense', 'income', 'transfer'] as const).map(t => (
          <Button
            key={t}
            type="button"
            variant={type === t ? 'default' : 'outline'}
            onClick={() => setType(t)}
          >
            {t === 'expense' ? 'Dépense' : t === 'income' ? 'Revenu' : 'Transfert'}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Nom du favori <span className="text-destructive">*</span></Label>
        <Input placeholder="Ex: Taxi, Restaurant, Salaire..." value={label} onChange={(e) => setLabel(e.target.value)} maxLength={50} />
      </div>

      <div className="space-y-2">
        <Label>Compte <span className="text-destructive">*</span></Label>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger><SelectValue placeholder="Choisir un compte" /></SelectTrigger>
          <SelectContent>
            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {type !== 'transfer' && (
        <div className="space-y-2">
          <Label>Catégorie <span className="text-destructive">*</span></Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>
                  <span className="flex items-center gap-2">
                    <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Montant fixe (optionnel)</Label>
        <Input
          type="number"
          placeholder="Laisser vide pour le demander à chaque fois"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground">Avec un montant fixe, une seule pression suffit pour créer la transaction.</p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : 'Créer le favori'}
      </Button>
    </form>
  );
}
