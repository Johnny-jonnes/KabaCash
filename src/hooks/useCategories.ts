'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { DEFAULT_CATEGORIES, CategoryDef } from '@/constants/categories';
import { CategoryType } from '@/types/enums';

/**
 * Hook qui fusionne les catégories par défaut avec les catégories
 * personnalisées créées par l'utilisateur (stockées dans Dexie).
 * 
 * Retourne une liste unifiée de catégories, sans doublons.
 */
export function useCategories(type?: CategoryType): CategoryDef[] {
  const userCategories = useLiveQuery(() => db.categories.toArray()) || [];

  const merged = useMemo(() => {
    // Partir des catégories par défaut
    const all: CategoryDef[] = [...DEFAULT_CATEGORIES];

    // Ajouter les catégories utilisateur qui ne sont pas déjà dans les defaults
    const defaultNames = new Set(DEFAULT_CATEGORIES.map(c => c.name.toLowerCase()));

    for (const uc of userCategories) {
      if (uc.deleted_at) continue; // ignorer les supprimées
      if (!defaultNames.has(uc.name.toLowerCase())) {
        all.push({
          name: uc.name,
          icon: uc.icon || 'tag',
          type: uc.type,
          color: uc.color || '#6B7280',
        });
      }
    }

    // Filtrer par type si demandé
    if (type) {
      return all.filter(c => c.type === type);
    }

    return all;
  }, [userCategories, type]);

  return merged;
}
