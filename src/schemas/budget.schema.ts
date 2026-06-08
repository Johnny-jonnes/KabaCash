import { z } from 'zod';
import { amountSchema, budgetPeriodSchema } from './shared.schema';

export const budgetSchema = z.object({
  category_id: z.string().uuid('La catégorie est requise'),
  amount_limit: amountSchema.min(1000, 'Le budget doit être d\'au moins 1000'),
  period_type: budgetPeriodSchema.default('monthly'),
  alerts_enabled: z.boolean().default(true),
  alert_threshold_percent: z.number().min(50).max(100).default(80),
  currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;
