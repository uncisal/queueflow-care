-- Add admin-only policies for category modifications
-- Only administrators should be able to insert, update, or delete categories

CREATE POLICY "Apenas administradores podem inserir categorias"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'administrador'::user_role));

CREATE POLICY "Apenas administradores podem atualizar categorias"
ON public.categories
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::user_role));

CREATE POLICY "Apenas administradores podem deletar categorias"
ON public.categories
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::user_role));