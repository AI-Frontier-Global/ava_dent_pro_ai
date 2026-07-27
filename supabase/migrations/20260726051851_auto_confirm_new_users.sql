/*
# Auto-confirm new signups
Supabase Auth has email confirmation enabled by default. New users created via
signUp get email_confirmed_at = NULL and cannot sign in until they click a
confirmation link — which never arrives in this app (no email provider configured).
This trigger sets email_confirmed_at on insert so every new account is immediately
usable, matching the "email confirmation stays OFF" guidance.
*/

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_new_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_new_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();
