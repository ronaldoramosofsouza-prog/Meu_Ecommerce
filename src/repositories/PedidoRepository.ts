import { db } from '../config/database';
import { ItemPedidoInput, Pedido, StatusPedido } from '../models/Pedido';

export class PedidoRepository {
  // Cria um pedido com status PENDENTE, validando itens, estoque, restaurante aprovado
  // e limite de 1 pedido ativo por usuário.
  static async criarPedidoComItens(
    usuarioId: string,
    itensInput: ItemPedidoInput[],
    metodoPagamento: string,
    enderecoEntrega: string
  ): Promise<Pedido> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      let restauranteConf = '';
      let restauranteId: string | null = null;
      const itens: { produto_id: string; quantidade: number; preco_unitario: number }[] = [];

      for (const item of itensInput) {
        const produto = await client.query(
          'SELECT preco, estoque, restaurante_id FROM produtos WHERE id = $1 FOR UPDATE',
          [item.produto_id]
        );
        if (!produto.rows[0]) {
          throw new Error('Produto não encontrado.');
        }
        if (produto.rows[0].estoque != null && produto.rows[0].estoque < item.quantidade) {
          throw new Error('Estoque insuficiente.');
        }
        if (!produto.rows[0].restaurante_id) {
          throw new Error(`O produto ${item.produto_id} não pertence a um restaurante.`);
        }

        if (!restauranteId) {
          restauranteId = produto.rows[0].restaurante_id;
        } else if (produto.rows[0].restaurante_id !== restauranteId) {
          throw new Error('Todos os itens do pedido devem ser do mesmo restaurante.');
        }

        const restaurante = await client.query(
          'SELECT status FROM restaurantes WHERE id = $1',
          [produto.rows[0].restaurante_id]
        );
        if (!restaurante.rows[0] || restaurante.rows[0].status !== 'APROVADO') {
          throw new Error('Este restaurante não está aprovado para receber pedidos.');
        }

        itens.push({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: Number(produto.rows[0].preco),
        });
      }

      const ativo = await client.query(
        `SELECT id FROM pedidos
         WHERE usuario_id = $1 AND status NOT IN ('CANCELADO', 'ENTREGUE')
         LIMIT 1`,
        [usuarioId]
      );
      if (ativo.rows[0]) {
        throw new Error('Você já possui um pedido em andamento.');
      }

      const valorTotal = itens.reduce((soma, i) => soma + i.preco_unitario * i.quantidade, 0);

      for (const item of itens) {
        await client.query('UPDATE produtos SET estoque = estoque - $1 WHERE id = $2', [
          item.quantidade,
          item.produto_id,
        ]);
      }

      const pedido = await client.query(
        `INSERT INTO pedidos (usuario_id, cliente_nome, restaurante_id, endereco_entrega, valor_total, status, metodo_pagamento)
         VALUES ($1, (SELECT nome FROM usuarios WHERE id = $1), $2, $3, $4, 'PENDENTE', $5)
         RETURNING id, usuario_id, restaurante_id, endereco_entrega, valor_total, status, metodo_pagamento, criado_em`,
        [usuarioId, restauranteId, enderecoEntrega, valorTotal, metodoPagamento]
      );

      for (const item of itens) {
        await client.query(
          `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
           VALUES ($1, $2, $3, $4)`,
          [pedido.rows[0].id, item.produto_id, item.quantidade, item.preco_unitario]
        );
      }

      await client.query('COMMIT');
      return pedido.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async buscarPorId(id: string): Promise<any | null> {
    const { rows } = await db.query(
      `SELECT p.*, r.usuario_id AS restaurante_usuario_id, e.usuario_id AS entregador_usuario_id
       FROM pedidos p
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       LEFT JOIN entregadores e ON e.id = p.entregador_id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  static async buscarTodos(): Promise<any[]> {
    const { rows } = await db.query(
      `SELECT p.id, p.usuario_id, p.entregador_id, p.restaurante_id, p.endereco_entrega,
              p.valor_total, p.status, p.metodo_pagamento, p.criado_em,
              u.nome AS cliente_nome, r.nome AS restaurante_nome, eu.nome AS entregador_nome
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       LEFT JOIN entregadores e ON e.id = p.entregador_id
       LEFT JOIN usuarios eu ON eu.id = e.usuario_id
       ORDER BY p.criado_em DESC`
    );
    return rows;
  }

  static async buscarPorRestaurante(restauranteId: string): Promise<any[]> {
    const { rows } = await db.query(
      `SELECT p.id, p.usuario_id, p.entregador_id, p.restaurante_id, p.endereco_entrega,
              p.valor_total, p.status, p.metodo_pagamento, p.criado_em,
              u.nome AS cliente_nome, r.nome AS restaurante_nome, eu.nome AS entregador_nome
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       LEFT JOIN entregadores e ON e.id = p.entregador_id
       LEFT JOIN usuarios eu ON eu.id = e.usuario_id
       WHERE p.restaurante_id = $1
       ORDER BY p.criado_em DESC`,
      [restauranteId]
    );
    return rows;
  }

  static async buscarPorUsuario(usuarioId: string): Promise<Pedido[]> {
    const { rows } = await db.query(
      `SELECT id, usuario_id, restaurante_id, entregador_id, endereco_entrega,
              valor_total, status, metodo_pagamento, criado_em
       FROM pedidos WHERE usuario_id = $1 ORDER BY criado_em DESC`,
      [usuarioId]
    );
    return rows;
  }

  static async buscarDisponiveisParaEntrega(): Promise<any[]> {
    const { rows } = await db.query(
      `SELECT p.id, p.usuario_id, p.entregador_id, p.restaurante_id, p.endereco_entrega,
              p.valor_total, p.status, p.metodo_pagamento, p.criado_em,
              r.nome AS restaurante_nome
       FROM pedidos p
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       WHERE p.status = 'PRONTO' AND p.entregador_id IS NULL
       ORDER BY p.criado_em DESC`
    );
    return rows;
  }

  static async vincularEntregador(pedidoId: string, entregadorUsuarioId: string): Promise<Pedido | null> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const pedido = await client.query(
        'SELECT status, entregador_id FROM pedidos WHERE id = $1 FOR UPDATE',
        [pedidoId]
      );
      if (!pedido.rows[0]) {
        throw new Error('Pedido não encontrado.');
      }
      if (pedido.rows[0].status !== 'PRONTO' || pedido.rows[0].entregador_id) {
        throw new Error('Este pedido não está disponível para entrega.');
      }

      const perfil = await client.query(
        'SELECT id FROM entregadores WHERE usuario_id = $1',
        [entregadorUsuarioId]
      );
      if (!perfil.rows[0]) {
        throw new Error('Perfil de entregador não encontrado.');
      }
      const entregadorId = perfil.rows[0].id;

      const atualizado = await client.query(
        `UPDATE pedidos SET entregador_id = $1, status = 'EM_ROTA'
         WHERE id = $2
         RETURNING id, usuario_id, restaurante_id, entregador_id, endereco_entrega,
                   valor_total, status, metodo_pagamento, criado_em`,
        [entregadorId, pedidoId]
      );
      await client.query(`UPDATE entregadores SET status = 'EM_ENTREGA' WHERE id = $1`, [entregadorId]);

      await client.query('COMMIT');
      return atualizado.rows[0] ?? null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async atualizarStatus(id: string, status: StatusPedido, entregadorId?: string): Promise<Pedido | null> {
    const atualizado = await db.query(
      `UPDATE pedidos SET status = $1 WHERE id = $2
       RETURNING id, usuario_id, restaurante_id, entregador_id, endereco_entrega,
                 valor_total, status, metodo_pagamento, criado_em`,
      [status, id]
    );
    if (!atualizado.rows[0]) {
      return null;
    }

    if (status === 'EM_ROTA' && entregadorId) {
      await db.query(`UPDATE entregadores SET status = 'EM_ENTREGA' WHERE id = $1`, [entregadorId]);
    }

    if (status === 'ENTREGUE' || status === 'CANCELADO') {
      const entregadorIdAtual = atualizado.rows[0].entregador_id;
      if (entregadorIdAtual) {
        await db.query(`UPDATE entregadores SET status = 'DISPONIVEL' WHERE id = $1`, [entregadorIdAtual]);
      }
    }

    return atualizado.rows[0];
  }
}
