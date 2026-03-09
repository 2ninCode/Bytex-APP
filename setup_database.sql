-- Execute este script no SQL Editor do Supabase para criar a tabela de estoque

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  stock INTEGER DEFAULT 0,
  location TEXT,
  category TEXT,
  icon_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança em nível de linha (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Permitir leitura e escrita para todos (ou restrinja apenas para autenticados se preferir)
CREATE POLICY "Enable all for authenticated users" ON inventory_items
  FOR ALL USING (true) WITH CHECK (true);
