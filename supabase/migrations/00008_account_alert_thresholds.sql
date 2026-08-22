-- ==========================================
-- Seuils d'alerte personnalisés par compte
-- ==========================================
-- Permet de définir, compte par compte, à quel solde être alerté (au lieu de la
-- seule heuristique automatique) et à partir de quel montant une transaction est
-- signalée comme "grosse transaction" (voir AccountAlertSettingsDialog.tsx et
-- lib/insights/generate.ts).

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS low_balance_threshold BIGINT,
  ADD COLUMN IF NOT EXISTS large_txn_threshold BIGINT;
