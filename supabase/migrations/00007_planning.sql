-- ==========================================
-- Planification (entrées datées prévues à l'avance)
-- ==========================================
-- Permet d'anticiper des dépenses/revenus futurs à une date précise (ex: gestion
-- agricole/saisonnière : "Mars : achat semences -500 000"), sans effet sur les
-- soldes tant que l'entrée n'est pas "réalisée" (convertie en vraie transaction).

CREATE TABLE planned_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id),
  account_id UUID REFERENCES accounts(id),
  -- TEXT et non UUID : même convention que category_id sur transactions/budgets
  -- (voir migration 00006) — c'est le nom de la catégorie, pas son id.
  category_id TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount BIGINT NOT NULL,
  currency TEXT DEFAULT 'GNF',
  description TEXT,
  planned_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'realized', 'skipped')),
  realized_transaction_id UUID REFERENCES transactions(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_planned_entries_user_id ON planned_entries(user_id);
CREATE INDEX idx_planned_entries_created_at ON planned_entries(created_at);
CREATE INDEX idx_planned_entries_planned_date ON planned_entries(planned_date);

ALTER TABLE planned_entries ENABLE ROW LEVEL SECURITY;

-- Même schéma de policies que le reste de l'app : SELECT/INSERT/UPDATE scopés à
-- auth.uid() ou aux membres de l'espace, pas de policy DELETE (suppression douce
-- uniquement, via UPDATE de deleted_at — voir AI_RULES.md).
CREATE POLICY "Users can view own or space planned entries" ON planned_entries FOR SELECT USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
CREATE POLICY "Users can insert own or space planned entries" ON planned_entries FOR INSERT WITH CHECK (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
CREATE POLICY "Users can update own or space planned entries" ON planned_entries FOR UPDATE USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
