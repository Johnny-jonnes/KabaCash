import { z } from 'zod';
import { amountSchema, categoryTypeSchema } from './shared.schema';

export const plannedEntrySchema = z.object({
  type: categoryTypeSchema,
  category_id: z.string().min(1, 'La catégorie est requise'),
  amount: amountSchema.min(1, 'Le montant doit être supérieur à 0').max(999999999999, 'Montant trop élevé'),
  description: z.string().max(200, 'Description trop longue').optional(),
  planned_date: z.string().min(1, 'La date est requise'),
  account_id: z.string().optional(),
});

export type PlannedEntryFormData = z.infer<typeof plannedEntrySchema>;
