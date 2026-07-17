-- ================================================================
-- BYTEX ESTOQUE APP — CORREÇÃO DEFINITIVA DE LOGIN (V5)
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ================================================================

-- 1. Garante que a extensão pgcrypto está ativa para criptografia de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insere os registros de funcionários na tabela interna auth.users
-- Isso corrige funcionários que foram criados direto no banco sem conta de autenticação
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
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  e.id,
  'authenticated',
  'authenticated',
  LOWER(e.login_id) || '@bytex.com',
  crypt(e.password, gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('name', e.name, 'role', e.role, 'job_title', e.job_title),
  e.created_at,
  now(),
  '', '', '', ''
FROM public.employees e
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = e.id
);

-- 3. Caso o usuário já existisse em auth.users, atualiza seu e-mail e senha
UPDATE auth.users u
SET 
  email = LOWER(e.login_id) || '@bytex.com',
  encrypted_password = crypt(e.password, gen_salt('bf', 10)),
  email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
  updated_at = now()
FROM public.employees e
WHERE u.id = e.id;

-- 4. Limpa identidades de e-mail antigas para evitar duplicidade ou conflitos
DELETE FROM auth.identities WHERE provider = 'email';

-- 5. Recria as identidades com o padrão login_id@bytex.com
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
WHERE u.role = 'authenticated';

-- ================================================================
-- FIM DO SCRIPT
-- ================================================================
