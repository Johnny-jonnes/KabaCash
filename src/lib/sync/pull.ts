import { db } from '@/lib/db/dexie';
import { createClient } from '@/lib/supabase/client';
import { REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';
import type { Table } from 'dexie';

// entity_type Supabase -> table Dexie locale. Les mêmes tables que sync/engine.ts
// pour la partie "push" — voir aussi ENTITY_TYPES_WITH_LOCAL_STATUS là-bas.
// Table<unknown, string> (et non any) : ces tables ont des formes de ligne
// différentes, unknown force un cast explicite à la lecture plutôt que de
// laisser passer n'importe quoi silencieusement.
const PULLABLE_TABLES: Array<{ name: string; table: Table<unknown, string> }> = [
  { name: 'accounts', table: db.accounts },
  { name: 'transactions', table: db.transactions },
  { name: 'budgets', table: db.budgets },
  { name: 'savings_goals', table: db.savingsGoals },
];

/**
 * Fusionne une ligne distante dans Dexie. Résolution de conflit "dernier écrivain
 * gagne" sur updated_at — pas de CRDT : suffisant pour une V1 multi-appareils/
 * multi-membres, à revoir si des conflits concurrents deviennent fréquents en usage réel.
 * Une ligne locale encore "pending" (modification pas encore poussée) n'est jamais
 * écrasée par une version distante plus ancienne qu'elle.
 */
async function mergeRow(table: Table<unknown, string>, remote: Record<string, unknown>) {
  const local = await table.get(remote.id as string) as { updated_at: string } | undefined;
  if (!local || new Date(remote.updated_at as string) >= new Date(local.updated_at)) {
    await table.put({ ...remote, sync_status: 'synced' });
  }
}

/** Récupère les données d'un espace partagé (comptes/transactions/budgets/objectifs + membres). */
export async function pullSpaceData(spaceId: string): Promise<void> {
  const supabase = createClient();

  for (const { name, table } of PULLABLE_TABLES) {
    const { data, error } = await supabase.from(name).select('*').eq('space_id', spaceId);
    if (error || !data) continue;
    for (const row of data) await mergeRow(table, row);
  }

  const { data: members } = await supabase.from('space_members').select('*').eq('space_id', spaceId).is('deleted_at', null);
  if (members) for (const m of members) await mergeRow(db.spaceMembers as Table<unknown, string>, m);

  const { data: space } = await supabase.from('spaces').select('*').eq('id', spaceId).maybeSingle();
  if (space) await mergeRow(db.spaces as Table<unknown, string>, space);
}

/** Récupère les données personnelles (hors espace) de l'utilisateur — comble aussi le fait qu'aucun pull cross-appareil n'existait avant la Phase 4. */
export async function pullPersonalData(userId: string): Promise<void> {
  const supabase = createClient();
  for (const { name, table } of PULLABLE_TABLES) {
    const { data, error } = await supabase.from(name).select('*').eq('user_id', userId).is('space_id', null);
    if (error || !data) continue;
    for (const row of data) await mergeRow(table, row);
  }
}

/** À appeler au démarrage de l'app : données personnelles + tous les espaces dont l'utilisateur est membre. */
export async function pullAllMyData(userId: string): Promise<void> {
  const supabase = createClient();
  await pullPersonalData(userId);

  const { data: memberships } = await supabase.from('space_members').select('space_id').eq('user_id', userId).is('deleted_at', null);
  if (!memberships) return;
  await Promise.all(memberships.map(m => pullSpaceData(m.space_id as string)));
}

/**
 * Abonnement Realtime : re-pull l'espace dès qu'un membre modifie une donnée
 * partagée, sans attendre le prochain chargement de page. Retourne la fonction
 * de désabonnement (à appeler au démontage / changement d'espace actif).
 */
export function subscribeToSpace(spaceId: string, onChange: () => void): () => void {
  const supabase = createClient();
  const tables = ['accounts', 'transactions', 'budgets', 'savings_goals', 'space_members'];

  const channel = supabase.channel(`space-${spaceId}`);
  for (const table of tables) {
    channel.on(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      { event: '*', schema: 'public', table, filter: `space_id=eq.${spaceId}` },
      () => { pullSpaceData(spaceId).then(onChange); }
    );
  }
  channel.subscribe();

  return () => { supabase.removeChannel(channel); };
}
