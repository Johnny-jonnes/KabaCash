'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { resolveSpacePermissions, type ResolvedSpacePermissions } from '@/lib/spaces/permissions';

/** Permissions réelles de l'utilisateur courant dans l'espace actif (aucune restriction en mode Personnel). */
export function useSpacePermissions(): ResolvedSpacePermissions {
  const { user } = useAuthStore();
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);

  const member = useLiveQuery(async () => {
    if (!activeSpaceId || !user) return null;
    const members = await db.spaceMembers.where('space_id').equals(activeSpaceId).toArray();
    return members.find(m => m.user_id === user.id && !m.deleted_at) ?? null;
  }, [activeSpaceId, user?.id]);

  return resolveSpacePermissions(member);
}
