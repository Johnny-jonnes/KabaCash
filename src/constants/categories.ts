import { CategoryType } from '@/types/enums';

export interface CategoryDef {
  name: string;
  icon: string; // Nom de l'icône Lucide (clé dans ICON_MAP)
  type: CategoryType;
  color: string;
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  // Dépenses
  { name: 'Alimentation / Marché', icon: 'shopping-cart', type: 'expense', color: '#F59E0B' },
  { name: 'Loyer / Logement', icon: 'home', type: 'expense', color: '#8B5CF6' },
  { name: 'Transport', icon: 'car', type: 'expense', color: '#3B82F6' },
  { name: 'Santé / Pharmacie', icon: 'heart-pulse', type: 'expense', color: '#EF4444' },
  { name: 'Éducation / Scolarité', icon: 'graduation-cap', type: 'expense', color: '#6366F1' },
  { name: 'Recharge Téléphone', icon: 'smartphone', type: 'expense', color: '#14B8A6' },
  { name: 'Envoi d\'argent', icon: 'send', type: 'expense', color: '#F97316' },
  { name: 'Électronique', icon: 'laptop', type: 'expense', color: '#64748B' },
  { name: 'Salaires / Charges', icon: 'hard-hat', type: 'expense', color: '#DC2626' },
  { name: 'Fournisseurs / Marchandises', icon: 'package', type: 'expense', color: '#A855F7' },
  { name: 'Business / Investissement', icon: 'trending-up', type: 'expense', color: '#059669' },
  { name: 'Loisirs / Sorties', icon: 'party-popper', type: 'expense', color: '#EC4899' },
  { name: 'Eau / Électricité (EDG)', icon: 'zap', type: 'expense', color: '#EAB308' },
  { name: 'Carburant / Groupe Élec.', icon: 'fuel', type: 'expense', color: '#78716C' },
  { name: 'Cérémonies', icon: 'gift', type: 'expense', color: '#D946EF' },
  { name: 'Maquis / Grin', icon: 'coffee', type: 'expense', color: '#92400E' },
  { name: 'Autres dépenses', icon: 'clipboard-list', type: 'expense', color: '#6B7280' },

  // Revenus
  { name: 'Salaire', icon: 'banknote', type: 'income', color: '#10B981' },
  { name: 'Ventes / Commerce', icon: 'store', type: 'income', color: '#22C55E' },
  { name: 'Freelance / Services', icon: 'wrench', type: 'income', color: '#34D399' },
  { name: 'Transfert reçu', icon: 'download', type: 'income', color: '#06B6D4' },
  { name: 'Autres revenus', icon: 'sparkles', type: 'income', color: '#84CC16' },
];
