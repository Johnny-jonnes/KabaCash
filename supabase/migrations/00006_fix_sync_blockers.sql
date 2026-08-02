-- ==========================================
-- Correctifs de synchronisation (2026-08-02)
-- ==========================================
-- Deux écarts entre le schéma local (Dexie) et Supabase empêchaient silencieusement
-- toute donnée catégorisée ou tout compte personnalisé d'atteindre le serveur.

-- 1. accounts.color : le formulaire de compte (choix de couleur) envoie ce champ
--    depuis longtemps, mais la colonne n'a jamais existé côté Supabase — chaque
--    upsert d'un compte échouait avec "Could not find the 'color' column".
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. category_id : dans TOUT le code local (TransactionForm, BudgetForm,
--    TemplateForm, categoryActions.ts, QuickAddFab...), category_id contient en
--    réalité le NOM de la catégorie, jamais son UUID — c'est ainsi que l'app
--    résout/renomme/associe les catégories partout, par conception. La colonne
--    Supabase avait été créée en UUID + clé étrangère vers categories(id), ce qui
--    rejetait chaque push contenant une vraie catégorie ("invalid input syntax for
--    type uuid"). On aligne Supabase sur le comportement réel de l'app plutôt que
--    l'inverse : réécrire tout le code pour utiliser de vrais UUID serait un
--    chantier disproportionné pour corriger un problème de synchronisation.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name = 'category_id'
      AND tc.table_name IN ('transactions', 'budgets', 'recurring_transactions', 'transaction_templates')
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

ALTER TABLE transactions ALTER COLUMN category_id TYPE TEXT;
ALTER TABLE transactions ALTER COLUMN category_id SET DEFAULT '';

ALTER TABLE budgets ALTER COLUMN category_id TYPE TEXT;

ALTER TABLE recurring_transactions ALTER COLUMN category_id TYPE TEXT;

ALTER TABLE transaction_templates ALTER COLUMN category_id TYPE TEXT;
