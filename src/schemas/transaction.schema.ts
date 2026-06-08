import { z } from 'zod';
import { amountSchema, transactionTypeSchema } from './shared.schema';

export const transactionSchema = z.object({
  account_id: z.string().min(1, 'Le compte est requis'),
  category_id: z.string().min(1, 'La catégorie est requise').optional(),
  type: transactionTypeSchema,
  amount: amountSchema.min(1, 'Le montant doit être supérieur à 0').max(999999999999, 'Montant trop élevé'),
  currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
  description: z.string().max(500, 'La description est trop longue').optional().or(z.literal('')),
  date: z.string().min(1, 'La date est requise'),
  transaction_time: z.string().optional(),
  transfer_to_account_id: z.string().optional(),
}).refine(data => {
  if (data.type === 'transfer' && !data.transfer_to_account_id) {
    return false;
  }
  return true;
}, {
  message: "Le compte de destination est requis pour un transfert",
  path: ["transfer_to_account_id"],
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
