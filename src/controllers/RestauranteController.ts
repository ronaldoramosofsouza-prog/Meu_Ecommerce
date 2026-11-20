import { Request, Response } from 'express';
import { RestauranteRepository } from '../repositories/RestauranteRepository';
import { RestauranteStatus } from '../models/Restaurante';

export class RestauranteController {
  // POST /api/restaurantes — cria o perfil do restaurante (papel RESTAURANTE), status PENDENTE
  static async cadastrar(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario?.id;
      const { nome, descricao, categoria, cnpj, endereco, imagem_url, lat, lng } = req.body;

      if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
      }

      if (!nome) {
        return res.status(400).json({ mensagem: 'O nome do restaurante é obrigatório.' });
      }

      const existente = await RestauranteRepository.buscarPorUsuarioId(usuarioId);
      if (existente) {
        return res.status(409).json({ mensagem: 'Este usuário já possui um perfil de restaurante.' });
      }

      const restaurante = await RestauranteRepository.criar({
        usuario_id: usuarioId,
        nome,
        descricao,
        categoria,
        cnpj,
        endereco,
        imagem_url,
        lat,
        lng,
      });

      return res.status(201).json({
        mensagem: 'Perfil do restaurante criado. Aguardando aprovação do administrador.',
        restaurante,
      });
    } catch (error) {
      console.error('Erro ao cadastrar restaurante:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao cadastrar restaurante.' });
    }
  }

  // GET /api/restaurantes/meu-perfil — dono do restaurante
  static async meuPerfil(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
      }

      const restaurante = await RestauranteRepository.buscarPorUsuarioId(usuarioId);
      if (!restaurante) {
        return res.status(404).json({ mensagem: 'Perfil de restaurante não encontrado.' });
      }

      return res.status(200).json(restaurante);
    } catch (error) {
      console.error('Erro ao buscar perfil do restaurante:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao buscar perfil.' });
    }
  }

  // GET /api/restaurantes — público: lista apenas restaurantes APROVADOS
  static async listar(_req: Request, res: Response): Promise<Response> {
    try {
      const restaurantes = await RestauranteRepository.buscarAprovados();
      return res.status(200).json(restaurantes);
    } catch (error) {
      console.error('Erro ao listar restaurantes:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao listar restaurantes.' });
    }
  }

  // GET /api/restaurantes/admin — ADMIN: lista todos (inclusive pendentes, para aprovar)
  static async listarTodos(_req: Request, res: Response): Promise<Response> {
    try {
      const restaurantes = await RestauranteRepository.buscarTodos();
      return res.status(200).json(restaurantes);
    } catch (error) {
      console.error('Erro ao listar todos os restaurantes:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao listar restaurantes.' });
    }
  }

  // PATCH /api/restaurantes/meu-perfil — dono atualiza os dados do próprio restaurante
  static async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
      }

      const restaurante = await RestauranteRepository.buscarPorUsuarioId(usuarioId);
      if (!restaurante?.id) {
        return res.status(404).json({ mensagem: 'Perfil de restaurante não encontrado.' });
      }

      const { nome, descricao, categoria, cnpj, endereco, imagem_url, lat, lng } = req.body;
      const atualizado = await RestauranteRepository.atualizar(restaurante.id, {
        nome,
        descricao,
        categoria,
        cnpj,
        endereco,
        imagem_url,
        lat,
        lng,
      });

      return res.status(200).json(atualizado);
    } catch (error) {
      console.error('Erro ao atualizar restaurante:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao atualizar restaurante.' });
    }
  }

  // PATCH /api/restaurantes/:id/aprovacao — ADMIN: aprovar ou rejeitar
  static async aprovarRejeitar(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['APROVADO', 'REJEITADO'].includes(status)) {
        return res.status(400).json({ mensagem: 'Status inválido. Use APROVADO ou REJEITADO.' });
      }

      const atualizado = await RestauranteRepository.atualizarStatus(id, status as RestauranteStatus);
      if (!atualizado) {
        return res.status(404).json({ mensagem: 'Restaurante não encontrado.' });
      }

      return res.status(200).json({
        mensagem: `Restaurante ${status === 'APROVADO' ? 'aprovado' : 'rejeitado'} com sucesso.`,
        restaurante: atualizado,
      });
    } catch (error) {
      console.error('Erro ao aprovar/rejeitar restaurante:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao processar aprovação.' });
    }
  }
}