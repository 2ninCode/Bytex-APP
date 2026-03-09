-- Criar tabela de preços de serviços
CREATE TABLE IF NOT EXISTS service_prices (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

-- Permissões
CREATE POLICY "Enable all for authenticated users" ON service_prices FOR ALL USING (true) WITH CHECK (true);

-- Dados Iniciais (Se necessário)
-- Hardware
INSERT INTO service_prices (id, category, name, price) VALUES 
('h1', 'Hardware', 'Limpeza preventiva (pó e oxidação)', 150),
('h2', 'Hardware', 'Troca de tela de notebook', 450),
('h3', 'Hardware', 'Upgrade de RAM ou SSD', 200),
('h4', 'Hardware', 'Troca de bateria', 220),
('h5', 'Hardware', 'Reparo de conector de carga', 180),
('h6', 'Hardware', 'Substituição de teclado / touchpad', 280),
('h7', 'Hardware', 'Reparo de placa-mãe (diagnóstico)', 350),
('h8', 'Hardware', 'Instalação de cooler / pasta térmica', 120),
('h9', 'Hardware', 'Troca de fonte de alimentação', 160)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;

-- Redes
INSERT INTO service_prices (id, category, name, price) VALUES 
('r1', 'Redes', 'Configuração de roteador Wi-Fi', 120),
('r2', 'Redes', 'Cabeamento estruturado (por ponto)', 80),
('r3', 'Redes', 'Instalação de repetidor / mesh', 100),
('r4', 'Redes', 'Configuração de firewall / VPN', 200),
('r5', 'Redes', 'Instalação de switch gerenciável', 150),
('r6', 'Redes', 'Configuração de VLAN', 180),
('r7', 'Redes', 'Diagnóstico de lentidão de rede', 90),
('r8', 'Redes', 'Instalação de câmeras IP / CFTV', 250),
('r9', 'Redes', 'Configuração de servidor NAS', 220)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;

-- Software
INSERT INTO service_prices (id, category, name, price) VALUES 
('s1', 'Software', 'Formatação com Backup', 180),
('s2', 'Software', 'Remoção de vírus / malware', 90),
('s3', 'Software', 'Instalação Pacote Office / Windows', 110),
('s4', 'Software', 'Configuração de e-mail corporativo', 100),
('s5', 'Software', 'Migração de dados / clonagem de HD', 160),
('s6', 'Software', 'Instalação e config. de ERP/CRM', 300),
('s7', 'Software', 'Configuração de backup automatizado', 140),
('s8', 'Software', 'Otimização de desempenho do sistema', 80),
('s9', 'Software', 'Instalação de antivírus corporativo', 120)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;
