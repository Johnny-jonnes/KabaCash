-- ==========================================
-- KabaCash - Phase 2 : centre de notifications persistant
-- ==========================================
-- Contexte : la Phase 1 générait des "insights" éphémères recalculés à chaque
-- visite du dashboard. La Phase 2 ajoute un centre de notifications persistant
-- (alertes budget/compte, prévisions, conseils, anomalies, nouvelles économies)
-- que l'utilisateur peut consulter et marquer comme lu.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('budget_alert', 'account_alert', 'forecast', 'advice', 'anomaly', 'new_saving')),
  tone TEXT NOT NULL CHECK (tone IN ('info', 'positive', 'warning', 'critical')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_modified_column();

GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;
