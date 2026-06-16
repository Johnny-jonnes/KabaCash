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
import { BudgetPeriod, CustomDurationUnit } from '@/types/enums';
import { toast } from 'sonner';

interface BudgetFormProps {
  onSuccess?: () => void;
}

const PERIOD_LABELS: Record<string, string> = {
  daily: 'Journalier',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  annual: 'Annuel',
  custom: 'Personnalisé',
};

const UNIT_LABELS: Record<CustomDurationUnit, string> = {
  hours: 'Heure(s)',
  days: 'Jour(s)',
  weeks: 'Semaine(s)',
  months: 'Mois',
  years: 'Année(s)',
};

export function BudgetForm({ onSuccess }: BudgetFormProps) {
  const { user } = useAuthStore();
  const [categoryId, setCategoryId] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [amountLimit, setAmountLimit] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [customDurationUnit, setCustomDurationUnit] = useState<CustomDurationUnit>('days');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === 'expense');

  const isAutresSelected = categoryId === 'Autres dépenses';
  const isCustomPeriod = period === 'custom';

  const finalCategoryId = isAutresSelected && customCategoryName.trim()
    ? customCategoryName.trim()
    : categoryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!finalCategoryId) {
      toast.error('Veuillez choisir une catégorie');
      return;
    }

    if (!amountLimit || parseInt(amountLimit) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    if (isCustomPeriod) {
      const val = parseInt(customDurationValue);
      if (!val || val <= 0) {
        toast.error('La durée personnalisée doit être supérieure à 0');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await db.budgets.add({
        id: uuidv4(),
        user_id: user.id,
        category_id: finalCategoryId,
        amount_limit: parseInt(amountLimit),
        period_type: period,
        ...(isCustomPeriod && {
          custom_duration_value: parseInt(customDurationValue),
          custom_duration_unit: customDurationUnit,
        }),
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
      toast.error('Erreur lors de la création du budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Catégorie de dépense <span className="text-destructive">*</span></Label>
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

      {isAutresSelected && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label>Nom de la catégorie <span className="text-destructive">*</span></Label>
          <Input 
            placeholder="Ex: Frais de scolarité enfants"
            value={customCategoryName}
            onChange={(e) => setCustomCategoryName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Limite de dépense <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Input 
            type="number" 
            placeholder="Ex: 500000" 
            className="pr-14"
            value={amountLimit}
            onChange={(e) => setAmountLimit(e.target.value)}
            required
            min={1}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            GNF
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Période <span className="text-destructive">*</span></Label>
        <Select onValueChange={(val) => setPeriod(val as BudgetPeriod)} defaultValue={period}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une période" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustomPeriod && (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Durée <span className="text-destructive">*</span></Label>
            <Input 
              type="number"
              placeholder="Ex: 2"
              value={customDurationValue}
              onChange={(e) => setCustomDurationValue(e.target.value)}
              required
              min={1}
              max={999}
            />
          </div>
          <div className="space-y-2">
            <Label>Unité <span className="text-destructive">*</span></Label>
            <Select onValueChange={(val) => setCustomDurationUnit(val as CustomDurationUnit)} defaultValue={customDurationUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(UNIT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || !categoryId || !amountLimit || (isAutresSelected && !customCategoryName.trim()) || (isCustomPeriod && !customDurationValue)}
      >
        {isSubmitting ? 'Création...' : 'Créer le budget'}
      </Button>
    </form>
  );
}
