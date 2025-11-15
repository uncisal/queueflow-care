-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles to authenticated users only
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix MISSING_RLS: Add explicit INSERT policy to block direct inserts
-- Inserts should only come from the handle_new_user trigger
CREATE POLICY "Block direct profile inserts"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Fix MISSING_RLS: Add explicit DELETE policy for administrators only
CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::user_role));