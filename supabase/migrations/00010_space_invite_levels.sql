-- ==========================================
-- Niveaux d'accès par code d'invitation
-- ==========================================
-- Jusqu'ici, un espace n'avait qu'UN seul code d'invitation, donnant toujours un
-- accès membre complet (avant configuration manuelle a posteriori par le chef —
-- voir migration 00009). Ici : le chef peut créer plusieurs codes supplémentaires,
-- chacun portant son propre jeu de permissions prédéfini ("niveau d'accès"). La
-- personne qui rejoint avec un code de niveau reçoit automatiquement ces
-- permissions dès son adhésion, sans configuration manuelle après coup.
--
-- Le code d'invitation historique de l'espace (spaces.invite_code) continue de
-- fonctionner exactement comme avant (accès membre complet) — rien de cassé pour
-- les espaces existants.

CREATE TABLE IF NOT EXISTS space_invite_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  can_add_transaction BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_budgets BOOLEAN NOT NULL DEFAULT FALSE,
  can_invite_members BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_all_accounts BOOLEAN NOT NULL DEFAULT TRUE,
  spending_limit_per_txn BIGINT,
  forbidden_categories TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_space_invite_levels_space_id ON space_invite_levels(space_id);

ALTER TABLE space_invite_levels ENABLE ROW LEVEL SECURITY;

-- Seul le chef voit/gère le catalogue de niveaux de son espace — un membre n'a
-- pas besoin de connaître les autres niveaux, seulement celui qu'on lui a partagé.
CREATE POLICY "Chef can view space access levels" ON space_invite_levels FOR SELECT USING (is_space_chef(space_id));
CREATE POLICY "Chef can update space access levels" ON space_invite_levels FOR UPDATE USING (is_space_chef(space_id));
-- Pas de policy INSERT directe : uniquement via create_space_access_level() (SECURITY DEFINER).

GRANT ALL ON TABLE public.space_invite_levels TO authenticated;
GRANT ALL ON TABLE public.space_invite_levels TO service_role;

CREATE TRIGGER update_space_invite_levels_modtime BEFORE UPDATE ON space_invite_levels FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ------------------------------------------
-- RPC : créer un niveau d'accès (chef uniquement)
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.create_space_access_level(
  p_space_id UUID, p_label TEXT,
  p_can_add_transaction BOOLEAN, p_can_manage_budgets BOOLEAN,
  p_can_invite_members BOOLEAN, p_can_view_all_accounts BOOLEAN,
  p_spending_limit_per_txn BIGINT, p_forbidden_categories TEXT[]
)
RETURNS space_invite_levels AS $$
DECLARE
  v_level space_invite_levels;
  v_code TEXT;
BEGIN
  IF NOT is_space_chef(p_space_id) THEN
    RAISE EXCEPTION 'Seul le chef de l''espace peut créer un niveau d''accès';
  END IF;

  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    v_code := translate(v_code, '01OIL', '23456');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM spaces WHERE invite_code = v_code)
      AND NOT EXISTS (SELECT 1 FROM space_invite_levels WHERE invite_code = v_code);
  END LOOP;

  INSERT INTO space_invite_levels (
    space_id, label, invite_code,
    can_add_transaction, can_manage_budgets, can_invite_members, can_view_all_accounts,
    spending_limit_per_txn, forbidden_categories
  )
  VALUES (
    p_space_id, p_label, v_code,
    p_can_add_transaction, p_can_manage_budgets, p_can_invite_members, p_can_view_all_accounts,
    p_spending_limit_per_txn, p_forbidden_categories
  )
  RETURNING * INTO v_level;

  RETURN v_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_space_access_level(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BIGINT, TEXT[]) TO authenticated;

-- ------------------------------------------
-- join_space_with_code : accepte maintenant aussi un code de niveau d'accès, et
-- copie ses permissions sur la ligne space_members créée. Le code de l'espace
-- (comportement historique, accès complet) continue de fonctionner à l'identique.
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.join_space_with_code(p_invite_code TEXT)
RETURNS spaces AS $$
DECLARE
  v_space spaces;
  v_level space_invite_levels;
  v_full_name TEXT;
BEGIN
  SELECT * INTO v_space FROM spaces WHERE invite_code = upper(p_invite_code) AND deleted_at IS NULL;

  IF v_space.id IS NULL THEN
    SELECT * INTO v_level FROM space_invite_levels WHERE invite_code = upper(p_invite_code) AND deleted_at IS NULL;
    IF v_level.id IS NOT NULL THEN
      SELECT * INTO v_space FROM spaces WHERE id = v_level.space_id AND deleted_at IS NULL;
    END IF;
  END IF;

  IF v_space.id IS NULL THEN
    RAISE EXCEPTION 'Code d''invitation invalide';
  END IF;

  IF EXISTS (SELECT 1 FROM space_members WHERE space_id = v_space.id AND user_id = auth.uid() AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Vous êtes déjà membre de cet espace';
  END IF;

  SELECT full_name INTO v_full_name FROM user_profiles WHERE id = auth.uid();

  INSERT INTO space_members (
    space_id, user_id, role, full_name,
    can_add_transaction, can_manage_budgets, can_invite_members, can_view_all_accounts,
    spending_limit_per_txn, forbidden_categories
  )
  VALUES (
    v_space.id, auth.uid(), 'membre', COALESCE(v_full_name, 'Membre'),
    v_level.can_add_transaction, v_level.can_manage_budgets, v_level.can_invite_members, v_level.can_view_all_accounts,
    v_level.spending_limit_per_txn, v_level.forbidden_categories
  )
  ON CONFLICT (space_id, user_id) DO UPDATE SET
    deleted_at = NULL, updated_at = NOW(),
    can_add_transaction = EXCLUDED.can_add_transaction,
    can_manage_budgets = EXCLUDED.can_manage_budgets,
    can_invite_members = EXCLUDED.can_invite_members,
    can_view_all_accounts = EXCLUDED.can_view_all_accounts,
    spending_limit_per_txn = EXCLUDED.spending_limit_per_txn,
    forbidden_categories = EXCLUDED.forbidden_categories;

  RETURN v_space;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
