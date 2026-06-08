'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { accountSchema, MOBILE_MONEY_OPERATORS, GUINEA_BANKS, ACCOUNT_COLORS, type AccountFormData } from '@/schemas/account.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Landmark, Wallet, Briefcase } from 'lucide-react';

interface AccountFormProps {
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, description: 'Orange Money, MTN MoMo...' },
  { value: 'cash', label: 'Espèces', icon: Wallet, description: 'Argent liquide, caisse' },
  { value: 'bank', label: 'Compte Bancaire', icon: Landmark, description: 'Ecobank, SGBG, BICIGUI...' },
  { value: 'business', label: 'Compte Pro', icon: Briefcase, description: 'Business, commerce' },
] as const;

export function AccountForm({ onSuccess }: AccountFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: '',
      type: 'mobile_money',
      initial_balance: 0,
      currency: 'GNF',
      color: '#FF6600',
    }
  });

  const selectedType = watch('type');
  const selectedColor = watch('color');

  const onSubmit = async (data: AccountFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const isOtherOperator = data.operator === 'other_mm';
      const isOtherBank = data.bank_name === 'other_bank';

      const finalOperator = isOtherOperator ? data.custom_operator_name || 'Autre' : data.operator;
      const finalBank = isOtherBank ? data.custom_bank_name || 'Autre' : data.bank_name;

      // Auto-générer le nom si vide selon le type
      let finalName = data.name;
      if (!finalName || finalName.trim() === '') {
        if (data.type === 'mobile_money' && data.operator) {
          if (isOtherOperator) {
            finalName = data.custom_operator_name || 'Mobile Money';
          } else {
            const op = MOBILE_MONEY_OPERATORS.find(o => o.value === data.operator);
            finalName = op ? op.label : 'Mobile Money';
          }
        } else if (data.type === 'bank' && data.bank_name) {
          if (isOtherBank) {
            finalName = data.custom_bank_name || 'Compte bancaire';
          } else {
            const bank = GUINEA_BANKS.find(b => b.value === data.bank_name);
            finalName = bank ? bank.label : 'Compte bancaire';
          }
        } else {
          finalName = ACCOUNT_TYPES.find(t => t.value === data.type)?.label || 'Compte';
        }
      }

      await db.accounts.add({
        id: uuidv4(),
        user_id: user.id,
        name: finalName,
        type: data.type,
        balance: data.initial_balance,
        currency: data.currency,
        color: data.color,
        operator: finalOperator,
        phone_number: data.phone_number,
        bank_name: finalBank,
        account_number: data.account_number,
        description: data.description,
        sort_order: 0,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création du compte', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      
      {/* === TYPE DE COMPTE === */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type de compte</Label>
        <div className="grid grid-cols-2 gap-2">
          {ACCOUNT_TYPES.map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setValue('type', value);
                // Auto-set couleur selon opérateur
                if (value === 'mobile_money') setValue('color', '#FF6600');
                if (value === 'cash') setValue('color', '#10B981');
                if (value === 'bank') setValue('color', '#3B82F6');
                if (value === 'business') setValue('color', '#8B5CF6');
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                selectedType === value 
                  ? 'border-primary bg-primary/10 shadow-sm' 
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${selectedType === value ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{description}</span>
            </button>
          ))}
        </div>
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      {/* === OPÉRATEUR MOBILE MONEY === */}
      {selectedType === 'mobile_money' && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="space-y-2">
            <Label>Opérateur</Label>
            <Select onValueChange={(val) => {
              setValue('operator', val);
              const op = MOBILE_MONEY_OPERATORS.find(o => o.value === val);
              if (op) setValue('color', op.color);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir l'opérateur" />
              </SelectTrigger>
              <SelectContent>
                {MOBILE_MONEY_OPERATORS.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: op.color }}></span>
                      {op.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {watch('operator') === 'other_mm' && (
            <div className="space-y-2">
              <Label>Nom de l'opérateur</Label>
              <Input 
                placeholder="Ex: T-Money, Moov..." 
                {...register('custom_operator_name')} 
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Numéro associé</Label>
            <Input 
              type="tel" 
              placeholder="Ex: 621 00 00 00" 
              {...register('phone_number')} 
            />
          </div>
        </div>
      )}

      {/* === BANQUE === */}
      {selectedType === 'bank' && (
        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="space-y-2">
            <Label>Banque</Label>
            <Select onValueChange={(val) => setValue('bank_name', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la banque" />
              </SelectTrigger>
              <SelectContent>
                {GUINEA_BANKS.map(bank => (
                  <SelectItem key={bank.value} value={bank.value}>{bank.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {watch('bank_name') === 'other_bank' && (
            <div className="space-y-2">
              <Label>Nom de la banque</Label>
              <Input 
                placeholder="Ex: UBA, VISTA..." 
                {...register('custom_bank_name')} 
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>4 derniers chiffres du compte (optionnel)</Label>
            <Input 
              type="text" 
              inputMode="numeric"
              maxLength={4} 
              placeholder="Ex: 4521" 
              {...register('account_number')} 
            />
          </div>
        </div>
      )}

      {/* === NOM DU COMPTE === */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom personnalisé (optionnel)</Label>
        <Input 
          id="name" 
          placeholder={
            selectedType === 'mobile_money' ? 'Ex: OM Perso, MTN Business...' :
            selectedType === 'cash' ? 'Ex: Caisse boutique, Poche...' :
            selectedType === 'bank' ? 'Ex: Épargne Ecobank...' :
            'Ex: Compte commerce Madina...'
          }
          {...register('name')} 
        />
        <p className="text-[10px] text-muted-foreground">Laissez vide pour utiliser le nom par défaut</p>
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* === DEVISE === */}
      <div className="space-y-2">
        <Label>Devise</Label>
        <Select onValueChange={(val: any) => setValue('currency', val)} defaultValue="GNF">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GNF">🇬🇳 Franc Guinéen (GNF)</SelectItem>
            <SelectItem value="USD">🇺🇸 Dollar US (USD)</SelectItem>
            <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* === SOLDE INITIAL === */}
      <div className="space-y-2">
        <Label htmlFor="initial_balance">Solde initial</Label>
        <div className="relative">
          <Input 
            id="initial_balance" 
            type="number" 
            className="pr-14"
            placeholder="0"
            {...register('initial_balance', { valueAsNumber: true })} 
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
            {watch('currency') || 'GNF'}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">Combien avez-vous actuellement sur ce compte ?</p>
        {errors.initial_balance && <p className="text-sm text-destructive">{errors.initial_balance.message}</p>}
      </div>

      {/* === COULEUR === */}
      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* === DESCRIPTION === */}
      <div className="space-y-2">
        <Label>Note (optionnelle)</Label>
        <Input 
          placeholder="Ex: Mon compte principal pour les achats" 
          {...register('description')} 
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : 'Créer le compte'}
      </Button>
    </form>
  );
}
