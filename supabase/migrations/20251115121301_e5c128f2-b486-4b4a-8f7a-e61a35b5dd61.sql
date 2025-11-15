-- Restrict system_settings to authenticated users only
-- Drop the public read policy and replace with authenticated-only access
DROP POLICY IF EXISTS "Configurações são públicas para leitura" ON public.system_settings;

CREATE POLICY "Configurações visíveis para usuários autenticados"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);