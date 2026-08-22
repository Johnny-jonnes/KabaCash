'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { filterBySpace } from '@/lib/spaces/filterBySpace';
import { transactionSchema, type TransactionFormData } from '@/schemas/transaction.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { createTransaction, updateTransaction, InsufficientFundsError } from '@/lib/transactions/createTransaction';
import { resolveOrCreateCategory } from '@/lib/categories/resolveOrCreateCategory';
import type { DBTransaction } from '@/types/database';

interface TransactionFormProps {
  onSuccess?: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
  defaultCategory?: string;
  defaultAmount?: number;
  defaultDescription?: string;
  defaultAccountId?: string;
  /** Transaction existante à modifier : bascule le formulaire en mode édition. */
  editingTransaction?: DBTransaction;
}

export function TransactionForm({
  onSuccess,
  defaultType = 'expense',
  defaultCategory,
  defaultAmount,
  defaultDescription,
  defaultAccountId,
  editingTransaction,
}: TransactionFormProps) {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const isEditing = !!editingTransaction;

  const allAccountsRaw = useLiveQuery(() => db.accounts.toArray());
  // Comptes de l'espace actif uniquement — voir QuickAddFab.tsx pour le détail du bug
  // corrigé. En édition, le compte déjà assigné reste proposé même s'il appartient à
  // un autre espace, pour ne jamais faire disparaître la valeur actuelle du select.
  const accounts = useMemo(() => {
    // !deleted_at : un compte fermé (ex: après une fusion) ne doit plus jamais être
    // proposable pour une nouvelle transaction, même s'il l'était encore en édition.
    const allAccounts = (allAccountsRaw || []).filter(a => !a.deleted_at);
    const filtered = filterBySpace(allAccounts, activeSpaceId);
    if (editingTransaction && !filtered.some(a => a.id === editingTransaction.account_id)) {
      const current = allAccounts.find(a => a.id === editingTransaction.account_id);
      if (current) return [current, ...filtered];
    }
    return filtered;
  }, [allAccountsRaw, activeSpaceId, editingTransaction]);

  const editCurrency = editingTransaction?.currency === 'USD' || editingTransaction?.currency === 'EUR'
    ? editingTransaction.currency
    : 'GNF';

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: editingTransaction ? {
      type: editingTransaction.type,
      amount: editingTransaction.amount,
      category_id: editingTransaction.category_id || '',
      account_id: editingTransaction.account_id,
      currency: editCurrency,
      date: editingTransaction.transaction_date,
      description: editingTransaction.description || '',
      transfer_to_account_id: editingTransaction.transfer_to_account_id,
    } : {
      type: defaultType,
      amount: defaultAmount || 0,
      category_id: defaultCategory || '',
      account_id: defaultAccountId || '',
      currency: 'GNF',
      date: new Date().toISOString().split('T')[0],
      description: defaultDescription || '',
    }
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category_id');
  const selectedAccountId = watch('account_id');
  const selectedTransferAccountId = watch('transfer_to_account_id');

  // Utiliser le hook qui fusionne defaults + custom
  const categories = useCategories(selectedType === 'transfer' ? undefined : (selectedType as 'income' | 'expense'));

  const isAutresSelected = selectedCategory === 'Autres dépenses' || selectedCategory === 'Autres revenus';

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;

    if (isAutresSelected && !customCategoryName.trim()) {
      toast.error('Veuillez saisir le nom de la catégorie');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategoryId = isAutresSelected && customCategoryName.trim()
        ? await resolveOrCreateCategory({ userId: user.id, name: customCategoryName.trim(), type: data.type === 'income' ? 'income' : 'expense' })
        : data.category_id;

      if (isEditing && editingTransaction) {
        await updateTransaction(editingTransaction.id, user.id, {
          accountId: data.account_id,
          type: data.type,
          amount: data.amount,
          categoryId: data.type === 'transfer' ? undefined : finalCategoryId,
          description: data.description,
          date: data.date,
          transferToAccountId: data.type === 'transfer' ? data.transfer_to_account_id : undefined,
        });
        toast.success('Transaction modifiée');
      } else {
        await createTransaction({
          userId: user.id,
          accountId: data.account_id,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          categoryId: data.type === 'transfer' ? undefined : finalCategoryId,
          description: data.description,
          date: data.date,
          transferToAccountId: data.type === 'transfer' ? data.transfer_to_account_id : undefined,
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        toast.error('Fonds insuffisants', { description: `Solde actuel : ${error.accountBalance} GNF.` });
      } else {
        console.error('Erreur transaction', error);
        toast.error('Une erreur est survenue');
      }
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
        <Label>Montant (GNF) <span className="text-destructive">*</span></Label>
        <Input 
          type="number" 
          placeholder="Ex: 50000" 
          {...register('amount', { valueAsNumber: true })} 
        />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Compte source <span className="text-destructive">*</span></Label>
        <Select value={selectedAccountId} onValueChange={(val) => setValue('account_id', val, { shouldValidate: true })}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un compte" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.balance} GNF)</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
      </div>

      {selectedType === 'transfer' && (
        <div className="space-y-2">
          <Label>Compte de destination <span className="text-destructive">*</span></Label>
          <Select value={selectedTransferAccountId} onValueChange={(val) => setValue('transfer_to_account_id', val, { shouldValidate: true })}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir le compte destinataire" />
            </SelectTrigger>
            <SelectContent>
              {accounts.filter(acc => acc.id !== selectedAccountId).map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.transfer_to_account_id && <p className="text-sm text-destructive">{errors.transfer_to_account_id.message}</p>}
        </div>
      )}

      {selectedType !== 'transfer' && (
        <>
          <div className="space-y-2">
            <Label>Catégorie <span className="text-destructive">*</span></Label>
            <Select value={selectedCategory} onValueChange={(val) => setValue('category_id', val, { shouldValidate: true })}>
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

          {isAutresSelected && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Nom de la catégorie <span className="text-destructive">*</span></Label>
              <Input 
                placeholder="Ex: Frais de taxi-moto"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                required
                minLength={2}
                maxLength={50}
              />
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <Label>Description (optionnelle)</Label>
        <Input 
          placeholder="Ex: Achat de matériel" 
          {...register('description')} 
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Valider'}
      </Button>
    </form>
  );
}
