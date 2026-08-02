import { db } from '@/lib/db/dexie';
import { createClient } from '@/lib/supabase/client';
import { pullSpaceData } from '@/lib/sync/pull';
import { logActivity } from '@/lib/db/activity-logger';
import type { DBSpace, DBSpaceMember } from '@/types/database';
import type { SpaceType } from '@/types/enums';

// La création/adhésion à un espace est la SEULE opération de l'app qui exige une
// connexion réseau : il faut coordonner l'accès entre plusieurs comptes réels, ce
// qui n'a pas de sens hors-ligne (voir offline.md — exception délibérée et isolée).
function requireOnline() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Une connexion internet est nécessaire pour cette action.');
  }
}

export async function createSpace(userId: string, name: string, type: SpaceType): Promise<DBSpace> {
  requireOnline();
  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_space', { p_name: name, p_type: type });
  if (error) throw new Error(error.message);

  const space = data as DBSpace;
  await db.spaces.put({ ...space, sync_status: 'synced' });
  await pullSpaceData(space.id);
  await logActivity({
    user_id: userId, entity_type: 'space', entity_id: space.id, action: 'create',
    new_values: { name: space.name, type: space.type },
    description: `Espace "${space.name}" créé`,
  });

  return space;
}

export async function joinSpace(userId: string, inviteCode: string): Promise<DBSpace> {
  requireOnline();
  const supabase = createClient();
  const { data, error } = await supabase.rpc('join_space_with_code', { p_invite_code: inviteCode.trim() });
  if (error) throw new Error(error.message === 'Code d\'invitation invalide' ? 'Code invalide' : error.message);

  const space = data as DBSpace;
  await db.spaces.put({ ...space, sync_status: 'synced' });
  await pullSpaceData(space.id);
  await logActivity({
    user_id: userId, entity_type: 'space', entity_id: space.id, action: 'create',
    new_values: { name: space.name },
    description: `A rejoint l'espace "${space.name}"`,
  });

  return space;
}

export async function leaveSpace(spaceId: string, userId: string): Promise<void> {
  requireOnline();
  const membership = await db.spaceMembers.where('space_id').equals(spaceId).filter(m => m.user_id === userId).first();
  if (!membership) return;

  const supabase = createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('space_members').update({ deleted_at: now }).eq('id', membership.id);
  if (error) throw new Error(error.message);

  await db.spaceMembers.update(membership.id, { deleted_at: now, sync_status: 'synced' });
}

export async function removeMember(memberRowId: string, spaceId: string, chefUserId: string): Promise<void> {
  requireOnline();
  const supabase = createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('space_members').update({ deleted_at: now }).eq('id', memberRowId);
  if (error) throw new Error(error.message);

  await db.spaceMembers.update(memberRowId, { deleted_at: now, sync_status: 'synced' });
  await logActivity({
    user_id: chefUserId, entity_type: 'space', entity_id: spaceId, action: 'update',
    description: `Membre retiré de l'espace`,
  });
}

export function getMySpaceMembership(spaceMembers: DBSpaceMember[], spaceId: string, userId: string): DBSpaceMember | undefined {
  return spaceMembers.find(m => m.space_id === spaceId && m.user_id === userId && !m.deleted_at);
}
