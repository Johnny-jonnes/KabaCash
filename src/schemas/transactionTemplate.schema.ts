import { z } from 'zod';
import { amountSchema, transactionTypeSchema } from './shared.schema';

export const transactionTemplateSchema = z.object({
  label: z.string().min(1, 'Le nom du favori est requis').max(50, 'Le nom est trop long'),
  type: transactionTypeSchema,
  account_id: z.string().min(1, 'Le compte est requis'),
  category_id: z.string().optional(),
  transfer_to_account_id: z.string().optional(),
  amount: amountSchema.max(999999999999, 'Montant trop élevé').optional(),
  description: z.string().max(500, 'La description est trop longue').optional().or(z.literal('')),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional(),
}).refine(data => {
  if (data.type === 'transfer' && !data.transfer_to_account_id) return false;
  return true;
}, {
  message: 'Le compte de destination est requis pour un transfert',
  path: ['transfer_to_account_id'],
});

export type TransactionTemplateFormData = z.infer<typeof transactionTemplateSchema>;
