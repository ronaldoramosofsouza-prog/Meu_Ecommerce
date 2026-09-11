import { Request, Response } from 'express';
import { EntregadorRepository } from '../repositories/EntregadorRepository';
import { io } from '../server';
import { PedidoRepository } from '../repositories/PedidoRepository';

const STATUS_VALIDOS = ['DISPONIVEL', 'EM_ENTREGA', 'OFFLINE'];

export class EntregadorController {
  // GET /api/entregador/perfil
  static async perfil(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario!.id;
      const perfil = await EntregadorRepository.buscarPerfilComNome(usuarioId);
      if (!perfil) {
        return res.status(404).json({ mensagem: 'Perfil de entregador não encontrado.' });
      }
      return res.status(200).json(perfil);
    } catch (error) {
      console.error('Erro ao buscar perfil do entregador:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar perfil.' });
    }
  }

  // PATCH /api/entregador/perfil — placa do veículo e status (DISPONIVEL/OFFLINE, nunca EM_ENTREGA manualmente)
  static async atualizarPerfil(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario!.id;
      const { placa_veiculo, status } = req.body;

      if (status && !STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ mensagem: 'Status inválido.' });
      }
      if (status === 'EM_ENTREGA') {
        return res.status(400).json({
          mensagem: 'O status EM_ENTREGA é definido automaticamente ao aceitar uma entrega.',
        });
      }

      const atual = await EntregadorRepository.buscarPorUsuarioId(usuarioId);
      if (!atual) {
        return res.status(404).json({ mensagem: 'Perfil de entregador não encontrado.' });
      }
      if (status && atual.status === 'EM_ENTREGA') {
        return res.status(409).json({
          mensagem: 'Não é possível mudar o status enquanto há uma entrega em andamento.',
        });
      }

      const atualizado = await EntregadorRepository.atualizarPerfil(usuarioId, { placa_veiculo, status });
      return res.status(200).json(atualizado);
    } catch (error) {
      console.error('Erro ao atualizar perfil do entregador:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar perfil.' });
    }
  }

  // GET /api/entregador/minhas-entregas
  static async minhasEntregas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario!.id;
      const entregas = await EntregadorRepository.buscarMinhasEntregas(usuarioId);
      return res.status(200).json(entregas);
    } catch (error) {
      console.error('Erro ao listar entregas do entregador:', error);
      return res.status(500).json({ mensagem: 'Erro ao listar entregas.' });
    }
  }

  // GET /api/entregador/historico
  static async historico(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario!.id;
      const historico = await EntregadorRepository.buscarHistorico(usuarioId);
      return res.status(200).json(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico do entregador:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar histórico.' });
    }
  }

  // GET /api/entregador/estatisticas
  static async estatisticas(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario!.id;
      const stats = await EntregadorRepository.buscarEstatisticas(usuarioId);
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do entregador:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar estatísticas.' });
    }
  }

  // PATCH /api/entregador/posicao — alternativa REST ao evento de socket 'enviar_posicao_gps'
  static async atualizarPosicao(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario!.id;
      const { pedido_id, lat, lng } = req.body;

      if (!pedido_id || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
        return res.status(400).json({ mensagem: 'Dados de posição inválidos.' });
      }

      const pedido = await PedidoRepository.buscarPorId(String(pedido_id));
      if (!pedido) {
        return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
      }
      if (pedido.entregador_usuario_id !== usuarioId) {
        return res.status(403).json({ mensagem: 'Este pedido não está atribuído a você.' });
      }

      await EntregadorRepository.atualizarPosicao(usuarioId, Number(lat), Number(lng));

      io.to(`pedido_${pedido_id}`).emit('atualizacao_gps_cliente', { pedidoId: pedido_id, lat, lng });
      io.to('admins').emit('atualizacao_gps_admin', { entregadorId: usuarioId, pedidoId: pedido_id, lat, lng });

      return res.status(200).json({ mensagem: 'Posição atualizada.' });
    } catch (error) {
      console.error('Erro ao atualizar posição do entregador:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar posição.' });
    }
  }
}
