-- ==========================================
-- KabaCash - Phase 1 : réparation de la synchronisation + favoris
-- ==========================================
-- Contexte : le moteur de sync local (lib/sync/engine.ts) n'appelait jamais
-- vraiment Supabase. En l'activant, plusieurs colonnes que le client envoie
-- déjà n'existaient pas encore côté serveur (voir chaque section ci-dessous) :
-- les upserts auraient échoué silencieusement ou perdu des champs. On corrige
-- ça d'abord, puis on ajoute les nouvelles entités de la Phase 1.

-- ------------------------------------------
-- 1. accounts : colonnes Mobile Money / Banque déjà utilisées par AccountForm
--    mais absentes du schéma initial (jamais synchronisées jusqu'ici)
-- ------------------------------------------
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS operator TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ------------------------------------------
-- 2. budgets : périodes 'daily'/'annual' + durée personnalisée existent côté
--    client (types/enums.ts BudgetPeriod) mais le CHECK et les colonnes
--    manquaient côté serveur
-- ------------------------------------------
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS custom_duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS custom_duration_unit TEXT CHECK (custom_duration_unit IN ('hours', 'days', 'weeks', 'months', 'years'));

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_period_type_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_period_type_check
  CHECK (period_type IN ('daily', 'weekly', 'monthly', 'annual', 'custom'));

-- ------------------------------------------
-- 3. categories : catégories désactivables sans perte d'historique
--    (au lieu de suppression, on masque des sélecteurs de saisie)
-- ------------------------------------------
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ------------------------------------------
-- 4. transaction_templates : "Favoris" — un tap recrée une transaction
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  transfer_to_account_id UUID REFERENCES accounts(id),
  amount BIGINT,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE transaction_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON transaction_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON transaction_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON transaction_templates FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_templates_user_id ON transaction_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_templates_created_at ON transaction_templates(created_at);

CREATE TRIGGER update_transaction_templates_modtime BEFORE UPDATE ON transaction_templates FOR EACH ROW EXECUTE FUNCTION update_modified_column();

GRANT ALL ON TABLE public.transaction_templates TO authenticated;
GRANT ALL ON TABLE public.transaction_templates TO service_role;

-- ------------------------------------------
-- 5. activity_logs : traçabilité (AI_RULES.md « toute modification importante
--    doit être historisée »). Journal d'audit immuable : SELECT + INSERT
--    seulement, volontairement pas de policy UPDATE/DELETE (RLS bloque par
--    défaut) pour qu'un enregistrement ne puisse pas être altéré après coup.
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore')),
  old_values JSONB,
  new_values JSONB,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

GRANT SELECT, INSERT ON TABLE public.activity_logs TO authenticated;
GRANT ALL ON TABLE public.activity_logs TO service_role;
