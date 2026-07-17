-- ================================================================
-- DEPURADOR DE AUTENTICAÇÃO E PERFIS BYTEX
-- Execute este script no SQL Editor do Supabase para criar a função de diagnóstico.
-- ================================================================

CREATE OR REPLACE FUNCTION public.debug_auth_status()
RETURNS TABLE (
  emp_id UUID,
  emp_login_id TEXT,
  emp_email TEXT,
  auth_email VARCHAR,
  has_auth_user BOOLEAN,
  has_identity BOOLEAN,
  identity_email JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS emp_id,
    e.login_id AS emp_login_id,
    e.email AS emp_email,
    u.email AS auth_email,
    (u.id IS NOT NULL) AS has_auth_user,
    (i.id IS NOT NULL) AS has_identity,
    i.identity_data AS identity_email
  FROM public.employees e
  LEFT JOIN auth.users u ON u.id = e.id
  LEFT JOIN auth.identities i ON i.user_id = e.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
