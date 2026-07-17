-- ================================================================
-- BYTEX ESTOQUE APP — VERSÃO 4
-- OS Completa, PCs de Clientes, Rastreio Público e Correção de Login
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ================================================================

-- ── 0. Extensões ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================================
-- 1. TABELA: customer_devices (PCs/Aparelhos por cliente)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.customer_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  serial_number TEXT,
  specs         JSONB DEFAULT '{}',
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.customer_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated CRUD on customer_devices"   ON public.customer_devices;
DROP POLICY IF EXISTS "Allow public read customer_devices"              ON public.customer_devices;

-- Funcionários: CRUD total
CREATE POLICY "Allow authenticated CRUD on customer_devices"
  ON public.customer_devices FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ✅ Clientes anônimos: leitura pública (para o link de rastreio funcionar sem login)
CREATE POLICY "Allow public read customer_devices"
  ON public.customer_devices FOR SELECT
  TO anon
  USING (true);

-- ================================================================
-- 2. TABELA: settings (configurações globais sincronizadas)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated access to settings" ON public.settings;

CREATE POLICY "Allow authenticated access to settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Configuração inicial do alerta de estoque (sincronizado para todos)
INSERT INTO public.settings (key, value)
  VALUES ('low_stock_threshold', '5')
  ON CONFLICT (key) DO NOTHING;

-- ================================================================
-- 3. NOVAS COLUNAS na tabela orders
-- ================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS responsible_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS device_id               UUID REFERENCES public.customer_devices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observation_client       TEXT,
  ADD COLUMN IF NOT EXISTS technical_report         TEXT,
  ADD COLUMN IF NOT EXISTS media_urls               JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS budget_items             JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS checklist                JSONB DEFAULT '{}';

-- ================================================================
-- 4. POLÍTICA DE LEITURA PÚBLICA — Link de Rastreio sem Login
-- Permite que o cliente acesse o link ?track=OS-XXXXX sem precisar
-- de conta ou senha. O laudo técnico é filtrado apenas no frontend.
-- ================================================================
DROP POLICY IF EXISTS "Allow public read for status tracking"        ON public.orders;
DROP POLICY IF EXISTS "Allow public read customers for tracking"     ON public.customers;

CREATE POLICY "Allow public read for status tracking"
  ON public.orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read customers for tracking"
  ON public.customers FOR SELECT
  TO anon
  USING (true);

-- ================================================================
-- 5. CORREÇÃO DE LOGIN — Inserir identidades faltantes em auth.identities
-- Usuários criados via SQL direto não tinham entrada em auth.identities,
-- causando o erro "ID/E-mail ou senha incorretos" mesmo com credenciais certas.
-- ================================================================
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub',            u.id::text,
    'email',          u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  now(),
  u.created_at,
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
)
  AND u.role = 'authenticated'; -- Apenas usuários reais (ignora usuário anon padrão)

-- ================================================================
-- 6. ATUALIZAÇÃO DA RPC admin_create_employee
-- Agora também insere em auth.identities (login funcionará corretamente)
-- ================================================================
CREATE OR REPLACE FUNCTION public.admin_create_employee(
  p_email       text,
  p_password    text,
  p_name        text,
  p_role        text,
  p_job_title   text,
  p_cpf         text DEFAULT NULL,
  p_phone       text DEFAULT NULL,
  p_birthdate   text DEFAULT NULL,
  p_avatar_url  text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_user_id  uuid;
  v_login_id text;
BEGIN
  IF NOT (
    COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'admin'
    OR COALESCE(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role', '') = 'gestor'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores ou gestores podem cadastrar funcionários.';
  END IF;

  v_login_id := split_part(p_email, '@', 1);

  -- ── Inserir usuário em auth.users ──────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', p_name, 'role', p_role, 'job_title', p_job_title),
    now(), now(),
    '', '', '', ''   -- strings vazias evitam erros de scan no GoTrue
  ) RETURNING id INTO v_user_id;

  -- ── ✅ Inserir identidade em auth.identities (CORREÇÃO DO LOGIN) ─
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub',            v_user_id::text,
      'email',          p_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    now(), now(), now()
  );

  -- ── Inserir perfil em public.employees ─────────────────────────
  INSERT INTO public.employees (
    id, login_id, name, email, role, job_title,
    cpf, phone, birthdate, avatar_url
  ) VALUES (
    v_user_id, v_login_id, p_name, p_email, p_role, p_job_title,
    p_cpf, p_phone, p_birthdate, p_avatar_url
  );

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 7. REALTIME — adicionar novas tabelas ao canal de tempo real
-- ================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_devices;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignora se já estiver na publicação
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- ================================================================
-- FIM DO SCRIPT — VERSÃO 4
-- Próximos passos:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Crie o bucket de storage "os-media" (Supabase > Storage > New Bucket)
--    Marque como PUBLIC para que o link de rastreio exiba as fotos/vídeos
-- ================================================================
