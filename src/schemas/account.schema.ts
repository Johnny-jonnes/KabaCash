import { z } from 'zod';
import { accountTypeSchema } from './shared.schema';

// Opérateurs Mobile Money en Guinée
export const MOBILE_MONEY_OPERATORS = [
  { value: 'orange_money', label: 'Orange Money', color: '#FF6600' },
  { value: 'mtn_momo', label: 'MTN MoMo', color: '#FFCC00' },
  { value: 'yup', label: 'YUP (SG)', color: '#00A650' },
  { value: 'ecobank_xpress', label: 'Ecobank Xpress', color: '#0066B3' },
  { value: 'afrimoney', label: 'Afrimoney (Africell)', color: '#E31E24' },
  { value: 'other_mm', label: 'Autre opérateur', color: '#6B7280' },
] as const;

// Banques de Guinée
export const GUINEA_BANKS = [
  { value: 'ecobank', label: 'Ecobank Guinée' },
  { value: 'sgbg', label: 'Société Générale (SGBG)' },
  { value: 'bicigui', label: 'BICIGUI (BNP Paribas)' },
  { value: 'bpmg', label: 'Banque Populaire (BPMG)' },
  { value: 'vista_bank', label: 'Vista Bank Guinée' },
  { value: 'orabank', label: 'Orabank Guinée' },
  { value: 'bdig', label: 'BDIG' },
  { value: 'uibg', label: 'UIBG' },
  { value: 'finadev', label: 'Finadev' },
  { value: 'other_bank', label: 'Autre banque' },
] as const;

// Couleurs prédéfinies pour les comptes
export const ACCOUNT_COLORS = [
  '#FF6600', // Orange
  '#FFCC00', // Jaune MTN
  '#10B981', // Vert Émeraude
  '#3B82F6', // Bleu
  '#8B5CF6', // Violet
  '#EF4444', // Rouge
  '#F97316', // Orange clair
  '#06B6D4', // Cyan
  '#EC4899', // Rose
  '#64748B', // Gris
] as const;

export const accountSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long'),
  type: accountTypeSchema,
  initial_balance: z.number()
    .int('Le montant doit être un nombre entier')
    .min(0, 'Le solde initial ne peut pas être négatif')
    .max(999_999_999_999, 'Montant trop élevé')
    .default(0),
  currency: z.enum(['GNF', 'USD', 'EUR']).default('GNF'),
  // Champs conditionnels selon le type
  operator: z.string().optional(),       // Pour mobile_money
  custom_operator_name: z.string().optional(),
  phone_number: z.string().optional(),   // Pour mobile_money
  bank_name: z.string().optional(),      // Pour bank
  custom_bank_name: z.string().optional(),
  account_number: z.string().optional(), // Pour bank (4 derniers chiffres)
  description: z.string().max(100).optional(), // Note libre
  color: z.string().default('#3B82F6'),
});

export type AccountFormData = z.infer<typeof accountSchema>;
