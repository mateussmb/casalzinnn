-- Delete duplicate gifts (keep the first one by id for each name)
DELETE FROM gifts 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY wedding_id, name ORDER BY created_at ASC) as rn
    FROM gifts
  ) t WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS gifts_wedding_name_unique ON gifts(wedding_id, name);

-- Insert new gifts
INSERT INTO gifts (wedding_id, name, category, price) VALUES
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Liquidificador', 'Cozinha', 90.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Micro-ondas', 'Cozinha', 470.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Jogo de panelas', 'Cozinha', 349.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Assadeiras', 'Cozinha', 72.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Formas de bolo', 'Cozinha', 25.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Jogo de talheres', 'Cozinha', 200.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Tábua de cortar', 'Cozinha', 35.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Jarra de água / suqueira', 'Cozinha', 35.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Panela de pressão', 'Cozinha', 160.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Panela elétrica de pressão', 'Cozinha', 450.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'AirFryer', 'Cozinha', 300.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Jogo de pratos (rasos, fundos, sobremesa)', 'Cozinha', 170.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Conjunto de copos', 'Cozinha', 70.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Geladeira', 'Casa', 4000.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Fogão', 'Casa', 2000.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Sofá', 'Casa', 2000.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Jogo de cama (lençóis, fronhas)', 'Quarto', 200.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Conjunto de toalhas (banho, rosto)', 'Quarto', 200.00),
  ('a5cbdee6-7e31-4e58-a2f0-bda3bb2f5d2e', 'Máquina de lavar', 'Casa', 2300.00)
ON CONFLICT (wedding_id, name) DO NOTHING;