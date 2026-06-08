'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from '@/components/categories/CategoryIcon';

interface BudgetFormProps {
  onSuccess?: () => void;
}

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const { user } = useAuthStore();
  const [categoryId, setCategoryId] = useState('');
  const [amountLimit, setAmountLimit] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !categoryId || !amountLimit) return;
    setIsSubmitting(true);

    try {
      await db.budgets.add({
        id: uuidv4(),
        user_id: user.id,
        category_id: categoryId,
        amount_limit: parseInt(amountLimit),
        period_type: period,
        currency: 'GNF',
        alerts_enabled: true,
        alert_threshold_percent: 80,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur création budget', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Catégorie de dépense</Label>
        <Select onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map(cat => (
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

      <div className="space-y-2">
        <Label>Limite de dépense</Label>
        <div className="relative">
          <Input 
            type="number" 
            placeholder="Ex: 500000" 
            className="pr-14"
            value={amountLimit}
            onChange={(e) => setAmountLimit(e.target.value)}
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            GNF
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Période</Label>
        <Select onValueChange={(val: any) => setPeriod(val)} defaultValue={period}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Journalier</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
            <SelectItem value="annual">Annuel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !categoryId || !amountLimit}>
        {isSubmitting ? 'Création...' : 'Créer le budget'}
      </Button>
    </form>
  );
}
