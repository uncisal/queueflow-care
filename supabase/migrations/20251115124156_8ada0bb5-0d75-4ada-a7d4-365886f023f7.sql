-- Fix PUBLIC_DATA_EXPOSURE: Restrict ticket updates to authenticated users only
-- This prevents public manipulation of ticket status, counter_location, and timestamps

DROP POLICY IF EXISTS "Qualquer um pode atualizar senhas" ON public.tickets;

CREATE POLICY "Only authenticated users can update tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (true);