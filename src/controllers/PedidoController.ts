import { Request, Response } from 'express';
import { PedidoRepository } from '../repositories/PedidoRepository';
import { RestauranteRepository } from '../repositories/RestauranteRepository';
import { io } from '../server';
import { STATUS_VALIDOS, TRANSICOES_RESTAURANTE, TRANSICOES_ENTREGADOR } from '../constants/pedidoStatus';

export class PedidoController {
  // POST /api/pedidos — cliente cria pedido (status inicial PENDENTE)
  static async criar(req: Request, res: Response): Promise<Response> {
    try {
      const { itens, metodo_pagamento, endereco_entrega } = req.body;
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
      }

      if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ mensagem: 'Informe ao menos um item no pedido.' });
      }

      if (!metodo_pagamento) {
        return res.status(400).json({ mensagem: 'Método de pagamento é obrigatório.' });
      }

      if (typeof endereco_entrega !== 'string' || endereco_entrega.trim() === '') {
        return res.status(400).json({ mensagem: 'Endereço de entrega é obrigatório.' });
      }

      const pedidoCriado = await PedidoRepository.criarPedidoComItens(
        usuarioId,
        itens,
        metodo_pagamento,
        endereco_entrega.trim()
      );

      io.to('admins').emit('pedido:novo', pedidoCriado);
      if (pedidoCriado.restaurante_id) {
        io.to(`restaurante_${pedidoCriado.restaurante_id}`).emit('pedido:novo', pedidoCriado);
      }

      return res.status(201).json({ mensagem: 'Pedido criado com sucesso.', pedido: pedidoCriado });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao criar pedido.';
      return res.status(400).json({ mensagem });
    }
  }

  // GET /api/pedidos/meus-pedidos — pedidos do cliente logado
  static async listarMeusPedidos(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
      }

      const pedidos = await PedidoRepository.buscarPorUsuario(usuarioId);
      return res.status(200).json(pedidos);
    } catch (error) {
      console.error('Erro ao listar pedidos do usuário:', error);
      return res.status(500).json({ mensagem: 'Erro ao listar pedidos.' });
    }
  }

  // GET /api/entregador/pedidos-disponiveis — apenas pedidos PRONTO sem entregador
  static async listarDisponiveis(_req: Request, res: Response): Promise<Response> {
    try {
      const pedidos = await PedidoRepository.buscarDisponiveisParaEntrega();
      return res.status(200).json(pedidos);
    } catch (error) {
      console.error('Erro ao listar pedidos disponíveis:', error);
      return res.status(500).json({ mensagem: 'Erro ao listar pedidos disponíveis.' });
    }
  }

  // POST /api/entregador/aceitar-pedido — entregador aceita pedido PRONTO
  static async aceitarPedido(req: Request, res: Response): Promise<Response> {
    try {
      const { pedido_id } = req.body;
      const entregadorUsuarioId = req.usuario?.id;

      if (!entregadorUsuarioId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
      }

      if (!pedido_id) {
        return res.status(400).json({ mensagem: 'Informe o pedido.' });
      }

      const pedido = await PedidoRepository.vincularEntregador(pedido_id, entregadorUsuarioId);
      if (!pedido) {
        return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
      }

      io.to(`pedido_${pedido_id}`).emit('status_alterado', pedido);
      io.to('admins').emit('status_alterado', pedido);

      return res.status(200).json({ mensagem: 'Entrega aceita com sucesso.', pedido });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao aceitar pedido.';
      return res.status(400).json({ mensagem });
    }
  }

  // GET /api/pedidos/:id — detalhe completo (cliente dono, restaurante dono, entregador do pedido, admin)
  static async buscarPorId(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const pedido = await PedidoRepository.buscarComItens(id);
      if (!pedido) {
        return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
      }

      const ehAdmin = req.usuario?.role === 'ADMIN';
      const ehClienteDono = pedido.usuario_id === req.usuario?.id;
      const ehRestauranteDono = pedido.restaurante_usuario_id === req.usuario?.id;
      const ehEntregadorDoPedido = pedido.entregador_usuario_id === req.usuario?.id;

      if (!ehAdmin && !ehClienteDono && !ehRestauranteDono && !ehEntregadorDoPedido) {
        return res.status(403).json({ mensagem: 'Você não tem permissão para ver este pedido.' });
      }

      return res.status(200).json(pedido);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar pedido.' });
    }
  }

  // GET /api/pedidos — lista pedidos (ADMIN: todos; RESTAURANTE: do seu restaurante)
  static async listarTodos(req: Request, res: Response): Promise<Response> {
    try {
      const role = req.usuario?.role;

      if (role === 'ADMIN') {
        const pedidos = await PedidoRepository.buscarTodos();
        return res.status(200).json(pedidos);
      }

      if (role === 'RESTAURANTE') {
        const perfil = await RestauranteRepository.buscarPorUsuarioId(req.usuario!.id);
        if (!perfil?.id) {
          return res.status(403).json({ mensagem: 'Crie um perfil de restaurante para ver pedidos.' });
        }
        const pedidos = await PedidoRepository.buscarPorRestaurante(perfil.id);
        return res.status(200).json(pedidos);
      }

      return res.status(403).json({ mensagem: 'Sem permissão para listar pedidos.' });
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      return res.status(500).json({ mensagem: 'Erro ao listar pedidos.' });
    }
  }

  // PATCH /api/pedidos/:id/status — transições por papel (ver TRANSICOES_*)
  static async atualizarStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ mensagem: 'Status inválido.' });
      }

      const pedido = await PedidoRepository.buscarPorId(id);
      if (!pedido) {
        return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
      }

      const ehAdmin = req.usuario?.role === 'ADMIN';
      const ehRestauranteDono =
        req.usuario?.role === 'RESTAURANTE' && pedido.restaurante_usuario_id === req.usuario?.id;
      const ehEntregadorDoPedido =
        req.usuario?.role === 'ENTREGADOR' && pedido.entregador_usuario_id === req.usuario?.id;

      let podeTransicionar = false;
      if (ehAdmin) {
        podeTransicionar = true;
      } else if (ehRestauranteDono) {
        podeTransicionar = TRANSICOES_RESTAURANTE[pedido.status]?.includes(status) ?? false;
      } else if (ehEntregadorDoPedido) {
        podeTransicionar = TRANSICOES_ENTREGADOR[pedido.status]?.includes(status) ?? false;
      }

      if (!podeTransicionar) {
        return res.status(403).json({ mensagem: 'Transição de status não permitida para este perfil.' });
      }

      const pedidoAtualizado = await PedidoRepository.atualizarStatus(id, status);

      io.to(`pedido_${id}`).emit('status_alterado', pedidoAtualizado);
      io.to('admins').emit('status_alterado', pedidoAtualizado);
      if (pedidoAtualizado?.restaurante_id) {
        io.to(`restaurante_${pedidoAtualizado.restaurante_id}`).emit('status_alterado', pedidoAtualizado);
      }

      // Avisa os entregadores apenas quando o pedido fica PRONTO
      if (status === 'PRONTO') {
        io.to('entregadores').emit('novo_pedido_disponivel', pedidoAtualizado);
      }

      return res.status(200).json(pedidoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar status do pedido.' });
    }
  }
}
