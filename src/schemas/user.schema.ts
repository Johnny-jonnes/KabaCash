import { z } from 'zod';
import { uiModeSchema } from './shared.schema';

export const userProfileSchema = z.object({
  full_name: z.string().min(2, 'Le nom est requis'),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  preferred_currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
  ui_mode: uiModeSchema.default('simple'),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

export const authSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  pin: z.string().length(4, 'Le code PIN doit contenir exactement 4 chiffres').regex(/^[0-9]+$/, 'Le code PIN ne doit contenir que des chiffres'),
});

export type AuthFormData = z.infer<typeof authSchema>;
