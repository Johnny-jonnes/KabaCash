import { z } from 'zod';
import { categoryTypeSchema } from './shared.schema';

export const categorySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom est trop long'),
  type: categoryTypeSchema,
  icon: z.string().min(1, 'L\'icône est requise'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide'),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
