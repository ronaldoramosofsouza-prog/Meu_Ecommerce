-- Migração 005: CNPJ do restaurante (campo de negócio comum no Brasil,
-- pedido pela tela de perfil do app do restaurante). Idempotente.

ALTER TABLE restaurantes ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20);
