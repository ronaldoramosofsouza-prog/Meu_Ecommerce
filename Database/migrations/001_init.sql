CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Usuários (Com suporte a Roles)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'CLIENTE' CHECK (role IN ('CLIENTE', 'ENTREGADOR', 'ADMIN')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Entregadores (Com coordenadas GPS em tempo real)
CREATE TABLE IF NOT EXISTS entregadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    placa_veiculo VARCHAR(20),
    status VARCHAR(20) DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL', 'EM_ENTREGA', 'OFFLINE')),
    lat_atual NUMERIC(10, 8),
    lng_atual NUMERIC(11, 8),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL,
    imagem_url VARCHAR(255),
    estoque INT DEFAULT 0,
    categoria_id VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Pedidos (Vinculados ao Cliente e ao Entregador)
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    entregador_id UUID REFERENCES entregadores(id),
    valor_total NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PRONTO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO')),
    metodo_pagamento VARCHAR(20) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id),
    quantidade INT NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL
);
