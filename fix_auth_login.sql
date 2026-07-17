-- ================================================================
-- BYTEX ESTOQUE APP — CORREÇÃO DEFINITIVA DE LOGIN
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ================================================================

-- 1. Garante que a extensão pgcrypto está ativa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Atualiza emails e confirmações em auth.users
-- Converte o login em email do formato login_id@bytex.com para consistência no login
-- E sincroniza/criptografa as senhas cadastradas na tabela de funcionários
UPDATE auth.users u
SET 
  email = LOWER(e.login_id) || '@bytex.com',
  encrypted_password = crypt(e.password, gen_salt('bf', 10)),
  email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
  updated_at = now()
FROM public.employees e
WHERE u.id = e.id;

-- 3. Limpa identidades de email antigas para evitar duplicidade ou conflitos de chave
DELETE FROM auth.identities WHERE provider = 'email';

-- 4. Recria as identidades com o novo padrão login_id@bytex.com
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

-- 5. Atualiza a tabela employees para refletir os emails corretos
-- (Se desejar manter o email original para contato, pode pular esta etapa,
-- mas para o fluxo de redefinição de senha ou envio é melhor manter o email correto no employees)
-- Vamos apenas garantir que o login_id esteja correto.
-- ================================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- ================================================================
