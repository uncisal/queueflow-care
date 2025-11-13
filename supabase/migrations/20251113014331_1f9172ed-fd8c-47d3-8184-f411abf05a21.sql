-- Sistema de autenticação e perfis de usuários

-- Enum para roles
CREATE TYPE public.user_role AS ENUM ('operador', 'supervisor', 'administrador');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de roles de usuários (para verificação segura)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Função para verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Trigger para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'operador'::user_role)
  );
  
  -- Adicionar role na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'operador'::user_role)
  );
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Administradores podem atualizar qualquer perfil" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'administrador'));

-- Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver todas as roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Apenas administradores podem gerenciar roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

-- Tabela de configurações do sistema
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações são públicas para leitura" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Apenas administradores podem modificar configurações" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
  ('notification_sound_enabled', 'true', 'Habilitar som de notificação no painel'),
  ('max_waiting_time_warning', '30', 'Tempo máximo de espera em minutos antes de alertar (0 = desabilitado)'),
  ('business_hours', '{"start": "07:00", "end": "18:00"}', 'Horário de funcionamento'),
  ('priority_categories', '["elderly", "pregnant", "disabled"]', 'Categorias de prioridade');