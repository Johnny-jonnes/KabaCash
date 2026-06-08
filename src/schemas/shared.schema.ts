import { z } from 'zod';

export const syncStatusSchema = z.enum(['pending', 'synced', 'conflict', 'deleted']);
export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const accountTypeSchema = z.enum(['cash', 'mobile_money', 'bank', 'business']);
export const budgetPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'annual']);
export const categoryTypeSchema = z.enum(['income', 'expense']);
export const recurrenceFrequencySchema = z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']);
export const uiModeSchema = z.enum(['simple', 'advanced']);

// Util for parsing amounts strictly as integers
export const amountSchema = z.number().int().nonnegative();
