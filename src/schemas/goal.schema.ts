import { z } from 'zod';
import { amountSchema } from './shared.schema';

export const goalSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom est trop long'),
  icon: z.string().min(1, "L'icône est requise"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide'),
  target_amount: amountSchema.min(1, 'Le montant doit être supérieur à 0').max(999999999999, 'Montant trop élevé'),
  target_date: z.string().min(1, 'La date cible est requise'),
  account_id: z.string().optional(),
});

export type GoalFormData = z.infer<typeof goalSchema>;
