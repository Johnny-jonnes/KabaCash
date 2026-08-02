-- ==========================================
-- KabaCash - Phase 4 : espaces Famille / Entreprise
-- ==========================================
-- Un compte "personnel" garde space_id = null (comportement actuel inchangé).
-- Un compte partagé appartient à UN SEUL espace. Les transactions/budgets/
-- objectifs qui en découlent portent le même space_id, dénormalisé au moment
-- de la création : ça garde les policies RLS simples (pas de jointure) et
-- rapides, au prix d'un update explicite si jamais un compte change d'espace
-- (non prévu pour l'instant — un compte ne change pas d'espace après coup).

-- ------------------------------------------
-- 1. Tables
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('family', 'business')),
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('chef', 'membre')),
  full_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (space_id, user_id)
);

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id);
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id);

CREATE INDEX IF NOT EXISTS idx_accounts_space_id ON accounts(space_id);
CREATE INDEX IF NOT EXISTS idx_transactions_space_id ON transactions(space_id);
CREATE INDEX IF NOT EXISTS idx_budgets_space_id ON budgets(space_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_space_id ON savings_goals(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members(space_id);

-- ------------------------------------------
-- 2. Fonctions utilitaires (SECURITY DEFINER : évite la récursion RLS
--    quand une policy sur accounts/transactions a besoin d'interroger
--    space_members, qui a elle-même du RLS)
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.is_space_member(p_space_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = p_space_id AND user_id = auth.uid() AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_space_chef(p_space_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = p_space_id AND user_id = auth.uid() AND role = 'chef' AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ------------------------------------------
-- 3. RPC : créer un espace (crée l'espace + la ligne "chef" en une seule
--    transaction atomique, avec un code d'invitation unique auto-généré)
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.create_space(p_name TEXT, p_type TEXT)
RETURNS spaces AS $$
DECLARE
  v_space spaces;
  v_code TEXT;
  v_full_name TEXT;
BEGIN
  IF p_type NOT IN ('family', 'business') THEN
    RAISE EXCEPTION 'Type d''espace invalide';
  END IF;

  LOOP
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    v_code := translate(v_code, '01OIL', '23456'); -- évite les caractères ambigus dans un code partagé par SMS
    EXIT WHEN NOT EXISTS (SELECT 1 FROM spaces WHERE invite_code = v_code);
  END LOOP;

  SELECT full_name INTO v_full_name FROM user_profiles WHERE id = auth.uid();

  INSERT INTO spaces (owner_id, name, type, invite_code)
  VALUES (auth.uid(), p_name, p_type, v_code)
  RETURNING * INTO v_space;

  INSERT INTO space_members (space_id, user_id, role, full_name)
  VALUES (v_space.id, auth.uid(), 'chef', COALESCE(v_full_name, 'Chef'));

  RETURN v_space;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------
-- 4. RPC : rejoindre un espace via son code d'invitation
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.join_space_with_code(p_invite_code TEXT)
RETURNS spaces AS $$
DECLARE
  v_space spaces;
  v_full_name TEXT;
BEGIN
  SELECT * INTO v_space FROM spaces WHERE invite_code = upper(p_invite_code) AND deleted_at IS NULL;

  IF v_space.id IS NULL THEN
    RAISE EXCEPTION 'Code d''invitation invalide';
  END IF;

  IF EXISTS (SELECT 1 FROM space_members WHERE space_id = v_space.id AND user_id = auth.uid() AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Vous êtes déjà membre de cet espace';
  END IF;

  SELECT full_name INTO v_full_name FROM user_profiles WHERE id = auth.uid();

  INSERT INTO space_members (space_id, user_id, role, full_name)
  VALUES (v_space.id, auth.uid(), 'membre', COALESCE(v_full_name, 'Membre'))
  ON CONFLICT (space_id, user_id) DO UPDATE SET deleted_at = NULL, updated_at = NOW();

  RETURN v_space;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------
-- 5. RLS : spaces
-- ------------------------------------------
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their spaces" ON spaces FOR SELECT USING (is_space_member(id));
CREATE POLICY "Chef can update space" ON spaces FOR UPDATE USING (is_space_chef(id));
-- Pas de policy INSERT directe : la création passe uniquement par create_space()
-- (SECURITY DEFINER), pour garantir que la ligne chef soit toujours créée avec.

CREATE TRIGGER update_spaces_modtime BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_modified_column();

GRANT ALL ON TABLE public.spaces TO authenticated;
GRANT ALL ON TABLE public.spaces TO service_role;
GRANT EXECUTE ON FUNCTION public.create_space(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_space_with_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_space_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_space_chef(UUID) TO authenticated;

-- ------------------------------------------
-- 6. RLS : space_members
-- ------------------------------------------
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view members of their spaces" ON space_members FOR SELECT USING (is_space_member(space_id));
-- Une seule policy UPDATE pour les deux cas (changement de rôle par le chef, ou
-- un membre qui se retire lui-même) : suppression douce (deleted_at) comme
-- partout ailleurs dans l'app, jamais de DELETE physique — voir finance.md /
-- AI_RULES.md. join_space_with_code() gère déjà le cas "revenir après être parti"
-- via ON CONFLICT ... DO UPDATE SET deleted_at = NULL.
CREATE POLICY "Chef can update members, member can update self" ON space_members FOR UPDATE USING (
  is_space_chef(space_id) OR auth.uid() = user_id
);
-- Pas de policy INSERT directe : uniquement via create_space() / join_space_with_code().

GRANT ALL ON TABLE public.space_members TO authenticated;
GRANT ALL ON TABLE public.space_members TO service_role;

-- ------------------------------------------
-- 7. RLS existantes étendues : visibilité par espace en plus du user_id
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
CREATE POLICY "Users can view own or space accounts" ON accounts FOR SELECT USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
CREATE POLICY "Users can insert own or space accounts" ON accounts FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (space_id IS NULL OR is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
CREATE POLICY "Users can update own or space accounts" ON accounts FOR UPDATE USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own or space transactions" ON transactions FOR SELECT USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own or space transactions" ON transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (space_id IS NULL OR is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own or space transactions" ON transactions FOR UPDATE USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);

DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
CREATE POLICY "Users can view own or space budgets" ON budgets FOR SELECT USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
CREATE POLICY "Users can insert own or space budgets" ON budgets FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (space_id IS NULL OR is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
CREATE POLICY "Users can update own or space budgets" ON budgets FOR UPDATE USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);

DROP POLICY IF EXISTS "Users can view own savings goals" ON savings_goals;
CREATE POLICY "Users can view own or space savings goals" ON savings_goals FOR SELECT USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can insert own savings goals" ON savings_goals;
CREATE POLICY "Users can insert own or space savings goals" ON savings_goals FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (space_id IS NULL OR is_space_member(space_id))
);
DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
CREATE POLICY "Users can update own or space savings goals" ON savings_goals FOR UPDATE USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND is_space_member(space_id))
);

-- ------------------------------------------
-- 8. Realtime : nécessaire pour que le pull-sync (src/lib/sync/pull.ts) reçoive
--    les changements en direct des autres membres d'un espace, pas seulement au
--    prochain chargement de page.
-- ------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['accounts', 'transactions', 'budgets', 'savings_goals', 'space_members', 'spaces']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
