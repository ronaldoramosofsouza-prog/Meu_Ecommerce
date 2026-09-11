-- Migração 003: taxa de entrega (base para estatísticas de ganhos do entregador)
-- Idempotente: pode ser executada mais de uma vez sem erro.

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC(10,2) NOT NULL DEFAULT 8.00;

-- Momento em que o pedido passou para ENTREGUE — usado para estatísticas de
-- ganhos do entregador (mais preciso que criado_em, que é a data do pedido).
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregue_em TIMESTAMP;
