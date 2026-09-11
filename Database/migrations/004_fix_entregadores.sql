-- Migração 004: alinha a tabela entregadores ao fluxo atual (perfil ligado a
-- usuarios, sem exigir nome/telefone/placa na criação) e corrige inconsistências
-- encontradas no schema real (colunas/valores que tinham ficado fora de sincronia
-- com as migrações anteriores). Idempotente: pode ser executada mais de uma vez.

-- 1. Normaliza valores de status para o padrão maiúsculo usado no restante do sistema.
UPDATE entregadores SET status = UPPER(status) WHERE status IS NOT NULL;

-- 2. Restringe e padroniza o status (mesmo padrão de pedidos.status).
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT c.conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'entregadores'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE entregadores DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conrelid = 'entregadores'::regclass AND conname = 'entregadores_status_check'
    ) THEN
        ALTER TABLE entregadores
            ADD CONSTRAINT entregadores_status_check
            CHECK (status IN ('DISPONIVEL', 'EM_ENTREGA', 'OFFLINE'));
    END IF;
END $$;

ALTER TABLE entregadores ALTER COLUMN status SET DEFAULT 'DISPONIVEL';

-- 3. nome/telefone/placa_veiculo passam a ser opcionais: o perfil agora nasce a
--    partir do usuário (usuarios.nome) e é completado depois pelo próprio
--    entregador via PATCH /api/entregador/perfil.
ALTER TABLE entregadores ALTER COLUMN nome DROP NOT NULL;
ALTER TABLE entregadores ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE entregadores ALTER COLUMN placa_veiculo DROP NOT NULL;

-- 4. Timestamp de última atualização (posição GPS, status, perfil).
ALTER TABLE entregadores ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 5. Um usuário tem no máximo um perfil de entregador (permite múltiplos NULL —
--    linhas legadas sem usuario_id não são afetadas pela unicidade).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conrelid = 'entregadores'::regclass AND conname = 'entregadores_usuario_id_key'
    ) THEN
        ALTER TABLE entregadores ADD CONSTRAINT entregadores_usuario_id_key UNIQUE (usuario_id);
    END IF;
END $$;
