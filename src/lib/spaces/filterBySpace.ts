/** Un espace actif = null (Personnel) filtre les lignes sans space_id ; sinon, celles du space_id choisi. */
export function filterBySpace<T extends { space_id?: string | null }>(rows: T[], activeSpaceId: string | null): T[] {
  return rows.filter(r => (r.space_id ?? null) === activeSpaceId);
}
