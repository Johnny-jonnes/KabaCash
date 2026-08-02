-- ==========================================
-- KabaCash - Phase 3 : objectifs d'épargne
-- ==========================================
-- current_amount avance uniquement via de vraies transactions de contribution
-- (voir lib/goals/goalActions.ts) : ce n'est pas un simple compteur déconnecté
-- des comptes réels de l'utilisateur.

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  target_amount BIGINT NOT NULL,
  current_amount BIGINT NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  account_id UUID REFERENCES accounts(id),
  reached_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);

CREATE TRIGGER update_savings_goals_modtime BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_modified_column();

GRANT ALL ON TABLE public.savings_goals TO authenticated;
GRANT ALL ON TABLE public.savings_goals TO service_role;
