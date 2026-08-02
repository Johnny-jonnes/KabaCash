-- ==========================================
-- KabaCash - Correctif critique : user_profiles jamais créé à l'inscription
-- ==========================================
-- Découverte : le formulaire d'inscription (register/page.tsx) appelle
-- supabase.auth.signUp() mais n'a jamais inséré la ligne correspondante dans
-- user_profiles. Or TOUTES les autres tables (accounts, categories,
-- transactions, budgets, transaction_templates, notifications,
-- savings_goals...) référencent user_profiles(id) par clé étrangère.
-- Résultat : chaque tentative de synchronisation échouait dès la toute
-- première insertion, pour tous les utilisateurs existants — seul
-- auth.users (géré automatiquement par Supabase Auth : email, identifiant)
-- était réellement peuplé, d'où l'impression que "seuls le compte et l'email"
-- partaient vers Supabase.
--
-- Fix : un trigger sur auth.users tient user_profiles à jour automatiquement,
-- à l'inscription ET à chaque modification du profil (settings/profile ne
-- modifiait déjà que auth.users via updateUser(), jamais user_profiles
-- directement — le trigger comble ce même trou dans les deux sens).

CREATE OR REPLACE FUNCTION public.handle_new_or_updated_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NEW.id::text)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', public.user_profiles.full_name),
    phone = COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), public.user_profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_or_updated_user();

-- Rattrapage : crée le profil manquant pour tous les comptes déjà inscrits
-- (y compris le vôtre) avant que ce correctif n'existe.
INSERT INTO public.user_profiles (id, full_name, phone)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Utilisateur'),
  COALESCE(NULLIF(au.raw_user_meta_data->>'phone', ''), au.id::text)
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
