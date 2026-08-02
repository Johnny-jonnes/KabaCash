'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { DEFAULT_CATEGORIES, CategoryDef } from '@/constants/categories';
import { CategoryType } from '@/types/enums';

export interface CategoryOption extends CategoryDef {
  id?: string;
  is_active: boolean;
  sort_order: number;
}

interface UseCategoriesOptions {
  /** Inclure les catégories désactivées (écrans de gestion des catégories). Par défaut false : les sélecteurs de saisie ne doivent jamais proposer une catégorie désactivée. */
  includeInactive?: boolean;
}

/**
 * Catégories de l'utilisateur, triées par sort_order.
 *
 * La base Dexie (peuplée au signup par seedDatabase) est la source de vérité :
 * c'est elle qui porte is_active/sort_order/personnalisations. DEFAULT_CATEGORIES
 * ne sert que de filet de sécurité pendant la fenêtre très courte entre la
 * création du compte et la fin du seed.
 */
export function useCategories(type?: CategoryType, options: UseCategoriesOptions = {}): CategoryOption[] {
  const { includeInactive = false } = options;
  const userCategoriesRaw = useLiveQuery(() => db.categories.toArray());

  return useMemo(() => {
    const rows = (userCategoriesRaw || []).filter(c => !c.deleted_at);

    const source: CategoryOption[] = rows.length > 0
      ? rows.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon || 'tag',
          type: c.type,
          color: c.color || '#6B7280',
          is_active: c.is_active !== false,
          sort_order: c.sort_order ?? 999,
        }))
      : DEFAULT_CATEGORIES.map((c, index) => ({ ...c, is_active: true, sort_order: index }));

    return source
      .filter(c => includeInactive || c.is_active)
      .filter(c => !type || c.type === type)
      .sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name));
  }, [userCategoriesRaw, type, includeInactive]);
}
