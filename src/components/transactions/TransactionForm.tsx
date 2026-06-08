'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { transactionSchema, type TransactionFormData } from '@/schemas/transaction.schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { toast } from 'sonner';

interface TransactionFormProps {
  onSuccess?: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
  defaultCategory?: string;
  defaultAmount?: number;
  defaultDescription?: string;
}

export function TransactionForm({ 
  onSuccess, 
  defaultType = 'expense',
  defaultCategory,
  defaultAmount,
  defaultDescription
}: TransactionFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: defaultType,
      amount: defaultAmount || 0,
      category_id: defaultCategory || '',
      currency: 'GNF',
      date: new Date().toISOString().split('T')[0],
      description: defaultDescription || '',
    }
  });

  const selectedType = watch('type');
  const categories = DEFAULT_CATEGORIES.filter(c => c.type === selectedType);

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const account = await db.accounts.get(data.account_id);
      if (!account) {
        toast.error('Compte introuvable');
        setIsSubmitting(false);
        return;
      }

      if ((data.type === 'expense' || data.type === 'transfer') && data.amount > account.balance) {
        toast.error('Fonds insuffisants', {
          description: `Le solde du compte est insuffisant pour cette opération. Solde actuel : ${account.balance} GNF.`
        });
        setIsSubmitting(false);
        return;
      }

      const tx = {
        id: uuidv4(),
        user_id: user.id,
        account_id: data.account_id,
        category_id: data.category_id || uuidv4(), // Fallback si pas de cat
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        description: data.description || '',
        transaction_date: data.date,
        sync_status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (data.type === 'transfer' && data.transfer_to_account_id) {
        Object.assign(tx, { transfer_to_account_id: data.transfer_to_account_id });
      }

      await db.transactions.add(tx);
      
      // Update account balance
      let newBalance = account.balance;
      if (data.type === 'income') newBalance += data.amount;
      if (data.type === 'expense') newBalance -= data.amount;
      if (data.type === 'transfer') newBalance -= data.amount; // Deduct from source
      
      await db.accounts.update(data.account_id, { balance: newBalance });
      
      // Add to transfer target
      if (data.type === 'transfer' && data.transfer_to_account_id) {
          const targetAcc = await db.accounts.get(data.transfer_to_account_id);
          if (targetAcc) {
              await db.accounts.update(data.transfer_to_account_id, { balance: targetAcc.balance + data.amount });
          }
      }

      import('@/lib/sync/queue').then(({ SyncQueue }) => {
        SyncQueue.add({
          entity_type: 'transactions',
          entity_id: tx.id,
          operation: 'create',
          payload: tx
        });
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erreur transaction', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Button 
          type="button" 
          variant={selectedType === 'expense' ? 'default' : 'outline'}
          className={selectedType === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}
          onClick={() => setValue('type', 'expense')}
        >
          Dépense
        </Button>
        <Button 
          type="button" 
          variant={selectedType === 'income' ? 'default' : 'outline'}
          className={selectedType === 'income' ? 'bg-primary hover:bg-primary/90' : ''}
          onClick={() => setValue('type', 'income')}
        >
          Revenu
        </Button>
        <Button 
          type="button" 
          variant={selectedType === 'transfer' ? 'default' : 'outline'}
          className={selectedType === 'transfer' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
          onClick={() => setValue('type', 'transfer')}
        >
          Transfert
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Montant (GNF)</Label>
        <Input 
          type="number" 
          placeholder="Ex: 50000" 
          {...register('amount', { valueAsNumber: true })} 
        />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Compte source</Label>
        <Select onValueChange={(val) => setValue('account_id', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un compte" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.balance} GNF)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedType === 'transfer' && (
        <div className="space-y-2">
          <Label>Compte de destination</Label>
          <Select onValueChange={(val) => setValue('transfer_to_account_id', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir le compte destinataire" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedType !== 'transfer' && (
        <div className="space-y-2">
          <Label>Catégorie</Label>
          <Select onValueChange={(val) => setValue('category_id', val)} defaultValue={defaultCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
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
        <Label>Description (optionnelle)</Label>
        <Input 
          placeholder="Ex: Achat de matériel" 
          {...register('description')} 
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : 'Valider'}
      </Button>
    </form>
  );
}
