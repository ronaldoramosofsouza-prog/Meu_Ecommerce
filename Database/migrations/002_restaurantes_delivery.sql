-- Migração 002: entidade Restaurante + papel RESTAURANTE + fluxo de pedidos de delivery
-- Idempotente: pode ser executada mais de uma vez sem erro.

-- 1. Tabela restaurantes (perfil do restaurante vinculado ao usuário RESTAURANTE)
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50),
    endereco TEXT,
    imagem_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
    lat NUMERIC(10, 8),
    lng NUMERIC(11, 8),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Papel RESTAURANTE em usuarios.role
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT c.conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'usuarios'::regclass
      AND c.contype = 'c'
      AND a.attname = 'role'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE usuarios DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conrelid = 'usuarios'::regclass AND conname = 'usuarios_role_check'
    ) THEN
        ALTER TABLE usuarios
            ADD CONSTRAINT usuarios_role_check
            CHECK (role IN ('CLIENTE', 'ENTREGADOR', 'ADMIN', 'RESTAURANTE'));
    END IF;
END $$;

-- 3. Novo ciclo de vida do pedido (7 estados)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT c.conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'pedidos'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE pedidos DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conrelid = 'pedidos'::regclass AND conname = 'pedidos_status_check'
    ) THEN
        ALTER TABLE pedidos
            ADD CONSTRAINT pedidos_status_check
            CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO'));
    END IF;
END $$;

-- 4. Produtos passam a ser do restaurante
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);

-- 5. Pedidos ganham restaurante e endereço de entrega
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES restaurantes(id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_entrega TEXT;

-- 6. Produtos ganham imagem (paridade com ProdutoRepository.criar)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- 7. Colunas exigidas pelos repositórios (idempotente): pedidos + entregadores
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pagamento VARCHAR(20);
ALTER TABLE pedidos ALTER COLUMN status SET DEFAULT 'PENDENTE';
ALTER TABLE entregadores ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);

-- 8. cliente_nome passa a ser opcional (preenchido por subquery no repositório)
ALTER TABLE pedidos ALTER COLUMN cliente_nome DROP NOT NULL;

-- 9. Colunas legado NOT NULL sem DEFAULT que o INSERT do repositório não preenche:
--    cliente_telefone, rua, numero, bairro passam a ser opcionais (idempotente).
ALTER TABLE pedidos ALTER COLUMN cliente_telefone DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN rua DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN numero DROP NOT NULL;
ALTER TABLE pedidos ALTER COLUMN bairro DROP NOT NULL;
