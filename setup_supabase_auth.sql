-- Habilitar a extensão pgcrypto para criptografia/hashing de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Recriar a tabela de funcionários apontando para auth.users
-- Nota: Caso a tabela já exista com estrutura de TEXT, vamos recriá-la.
DROP TABLE IF EXISTS public.employees CASCADE;

CREATE TABLE public.employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  birthdate TEXT,
  job_title TEXT,
  role TEXT DEFAULT 'funcionario' CHECK (role IN ('admin', 'gestor', 'funcionario')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ativar Row Level Security (RLS) para employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela employees
CREATE POLICY "Allow authenticated read on employees" 
  ON public.employees FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admins all actions on employees" 
  ON public.employees FOR ALL 
  TO authenticated 
  USING (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin')
  WITH CHECK (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin');

-- 2. Trigger para sincronizar atualizações do employees com auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_employee_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'name', NEW.name,
    'role', NEW.role,
    'job_title', NEW.job_title
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_employee_updated
  AFTER UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_to_auth();

-- 3. Função RPC para criação segura de novo funcionário (apenas admins/gestores)
CREATE OR REPLACE FUNCTION public.admin_create_employee(
  p_email text,
  p_password text,
  p_name text,
  p_role text,
  p_job_title text,
  p_cpf text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_birthdate text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_login_id text;
BEGIN
  -- Verificar se o chamador é admin ou gestor no JWT
  IF NOT (
    COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
    OR COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'gestor'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores ou gestores podem cadastrar funcionários.';
  END IF;

  v_login_id := split_part(p_email, '@', 1);

  -- Inserir na tabela auth.users do Supabase
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', p_name, 'role', p_role, 'job_title', p_job_title),
    now(),
    now()
  ) RETURNING id INTO v_user_id;

  -- Inserir perfil na tabela public.employees
  INSERT INTO public.employees (
    id,
    login_id,
    name,
    email,
    role,
    job_title,
    cpf,
    phone,
    birthdate,
    avatar_url
  ) VALUES (
    v_user_id,
    v_login_id,
    p_name,
    p_email,
    p_role,
    p_job_title,
    p_cpf,
    p_phone,
    p_birthdate,
    p_avatar_url
  );

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função RPC para deleção segura de funcionário (apenas admins)
CREATE OR REPLACE FUNCTION public.admin_delete_employee(p_employee_id uuid)
RETURNS void AS $$
BEGIN
  -- Verificar se o chamador é admin
  IF NOT (
    COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover funcionários.';
  END IF;

  -- Deletar da tabela auth.users do Supabase (isso aciona cascade delete em public.employees)
  DELETE FROM auth.users WHERE id = p_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função RPC para alteração de senha por administradores
CREATE OR REPLACE FUNCTION public.admin_update_employee_password(p_employee_id uuid, p_new_password text)
RETURNS void AS $$
BEGIN
  -- Verificar se o chamador é admin ou o próprio funcionário
  IF NOT (
    COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
    OR auth.uid() = p_employee_id
  ) THEN
    RAISE EXCEPTION 'Não autorizado a alterar a senha deste usuário.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf', 10))
  WHERE id = p_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Atualizar as políticas de RLS das tabelas de negócio para EXIGIR autenticação (TO authenticated)
-- Isso remove o acesso público de anônimos.

-- Tabela: inventory_items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.inventory_items;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access to inventory_items" 
  ON public.inventory_items FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Tabela: service_prices
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.service_prices;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access to service_prices" 
  ON public.service_prices FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Tabela: orders
-- Adicionar RLS e políticas se não existirem
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.orders;
CREATE POLICY "Allow authenticated access to orders" 
  ON public.orders FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Tabela: customers
-- Adicionar RLS e políticas se não existirem
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.customers;
CREATE POLICY "Allow authenticated access to customers" 
  ON public.customers FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
