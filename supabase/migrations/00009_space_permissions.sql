-- ==========================================
-- Permissions réelles par membre d'espace
-- ==========================================
-- Jusqu'ici, un "membre" avait exactement les mêmes droits que le "chef" dès qu'il
-- avait accès à l'espace : aucune vraie granularité. Ajoute, par membre : le droit
-- d'ajouter des transactions, de gérer les budgets, d'inviter (voir/partager le code),
-- de voir tous les comptes de l'espace (sinon uniquement les siens), une limite de
-- dépense par transaction, et une liste de catégories interdites.
--
-- Appliqué à deux niveaux, comme demandé ("pas seulement théorique") :
--  1. Client (offline-first) : lib/spaces/permissions.ts, vérifié avant toute création
--     locale (TransactionForm, BudgetForm).
--  2. Ici, RLS : même si un client contournait la vérification côté app, Supabase
--     refuse l'écriture — seule source de vérité qui ne peut pas être outrepassée
--     hors-ligne "en trichant" sur le client.
--
-- Le chef garde TOUJOURS tous les droits (voir fonctions ci-dessous) : ces colonnes
-- ne s'appliquent qu'aux membres. Valeur NULL = comportement historique (accès complet),
-- pour ne rien casser pour les membres déjà existants avant cette migration.

ALTER TABLE space_members
  ADD COLUMN IF NOT EXISTS can_add_transaction BOOLEAN,
  ADD COLUMN IF NOT EXISTS can_manage_budgets BOOLEAN,
  ADD COLUMN IF NOT EXISTS can_invite_members BOOLEAN,
  ADD COLUMN IF NOT EXISTS can_view_all_accounts BOOLEAN,
  ADD COLUMN IF NOT EXISTS spending_limit_per_txn BIGINT,
  ADD COLUMN IF NOT EXISTS forbidden_categories TEXT[];

-- ------------------------------------------
-- Fonctions de vérification (SECURITY DEFINER, même raison qu'is_space_member/
-- is_space_chef dans la migration 00005 : évite la récursion RLS).
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.space_member_can_add_transaction(p_space_id UUID, p_amount BIGINT, p_category_id TEXT, p_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_member space_members;
BEGIN
  SELECT * INTO v_member FROM space_members WHERE space_id = p_space_id AND user_id = auth.uid() AND deleted_at IS NULL;
  IF v_member.id IS NULL THEN RETURN FALSE; END IF;
  IF v_member.role = 'chef' THEN RETURN TRUE; END IF;
  IF COALESCE(v_member.can_add_transaction, TRUE) IS FALSE THEN RETURN FALSE; END IF;
  IF p_type = 'expense' THEN
    IF v_member.spending_limit_per_txn IS NOT NULL AND p_amount > v_member.spending_limit_per_txn THEN RETURN FALSE; END IF;
    IF v_member.forbidden_categories IS NOT NULL AND p_category_id = ANY(v_member.forbidden_categories) THEN RETURN FALSE; END IF;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.space_member_can_manage_budgets(p_space_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'chef' OR COALESCE(can_manage_budgets, FALSE) FROM space_members WHERE space_id = p_space_id AND user_id = auth.uid() AND deleted_at IS NULL),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.space_member_can_view_all_accounts(p_space_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'chef' OR COALESCE(can_view_all_accounts, TRUE) FROM space_members WHERE space_id = p_space_id AND user_id = auth.uid() AND deleted_at IS NULL),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.space_member_can_add_transaction(UUID, BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.space_member_can_manage_budgets(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.space_member_can_view_all_accounts(UUID) TO authenticated;

-- ------------------------------------------
-- RLS : transactions — un membre restreint ne peut plus insérer/mettre à jour au-delà
-- de ce que ses permissions autorisent.
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can insert own or space transactions" ON transactions;
CREATE POLICY "Users can insert own or space transactions" ON transactions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    space_id IS NULL OR (is_space_member(space_id) AND space_member_can_add_transaction(space_id, amount, category_id, type))
  )
);

-- ------------------------------------------
-- RLS : budgets — seul le chef ou un membre avec can_manage_budgets peut créer/modifier.
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can insert own or space budgets" ON budgets;
CREATE POLICY "Users can insert own or space budgets" ON budgets FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (space_id IS NULL OR space_member_can_manage_budgets(space_id))
);
DROP POLICY IF EXISTS "Users can update own or space budgets" ON budgets;
CREATE POLICY "Users can update own or space budgets" ON budgets FOR UPDATE USING (
  auth.uid() = user_id OR (space_id IS NOT NULL AND space_member_can_manage_budgets(space_id))
);

-- ------------------------------------------
-- RLS : comptes — visibilité restreinte si can_view_all_accounts = false (le membre
-- ne voit plus que les comptes qu'il a lui-même créés dans l'espace).
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can view own or space accounts" ON accounts;
CREATE POLICY "Users can view own or space accounts" ON accounts FOR SELECT USING (
  auth.uid() = user_id OR (
    space_id IS NOT NULL AND is_space_member(space_id) AND
    (space_member_can_view_all_accounts(space_id) OR user_id = auth.uid())
  )
);

-- Cohérence : les transactions d'un compte devenu invisible ne doivent pas non plus
-- rester visibles pour un membre restreint.
DROP POLICY IF EXISTS "Users can view own or space transactions" ON transactions;
CREATE POLICY "Users can view own or space transactions" ON transactions FOR SELECT USING (
  auth.uid() = user_id OR (
    space_id IS NOT NULL AND is_space_member(space_id) AND (
      space_member_can_view_all_accounts(space_id) OR
      account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
    )
  )
);
