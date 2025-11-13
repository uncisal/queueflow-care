-- Criação das tabelas do sistema de filas

-- Tabela de categorias de atendimento
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prefix text NOT NULL UNIQUE,
  color text NOT NULL,
  priority_enabled boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de senhas/tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.categories(id) NOT NULL,
  is_priority boolean DEFAULT false,
  status text NOT NULL DEFAULT 'waiting',
  counter_location text,
  created_at timestamptz DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'called', 'in_service', 'completed', 'cancelled'))
);

-- Tabela de chamadas (histórico)
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) NOT NULL,
  counter_location text NOT NULL,
  called_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_category ON public.tickets(category_id);
CREATE INDEX idx_tickets_created ON public.tickets(created_at);
CREATE INDEX idx_calls_called_at ON public.calls(called_at DESC);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para leitura pública (totem e painel)
CREATE POLICY "Categorias são públicas" ON public.categories
  FOR SELECT USING (active = true);

CREATE POLICY "Senhas são públicas para leitura" ON public.tickets
  FOR SELECT USING (true);

CREATE POLICY "Chamadas são públicas para leitura" ON public.calls
  FOR SELECT USING (true);

-- Políticas para inserção pública (totem)
CREATE POLICY "Qualquer um pode criar senha" ON public.tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Qualquer um pode registrar chamada" ON public.calls
  FOR INSERT WITH CHECK (true);

-- Políticas para update público (operadores)
CREATE POLICY "Qualquer um pode atualizar senhas" ON public.tickets
  FOR UPDATE USING (true);

-- Inserir categorias padrão
INSERT INTO public.categories (name, prefix, color, priority_enabled) VALUES
  ('Cadastro / Recepção', 'A', '#1E88E5', true),
  ('Triagem', 'B', '#43A047', true),
  ('Atendimento Médico', 'C', '#E53935', true),
  ('Exames', 'D', '#FB8C00', false),
  ('Serviços Administrativos', 'E', '#8E24AA', false);

-- Habilitar realtime para atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;