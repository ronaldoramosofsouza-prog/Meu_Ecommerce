import { Request, Response } from 'express';
import { ProdutoRepository } from '../repositories/ProdutoRepository';
import { RestauranteRepository } from '../repositories/RestauranteRepository';

export class ProdutoController {
  // GET /api/produtos — público: lista produtos disponíveis de restaurantes aprovados
  static async listar(req: Request, res: Response): Promise<Response> {
    try {
      const { restaurante_id } = req.query;
      const restauranteId =
        typeof restaurante_id === 'string' && restaurante_id.trim() !== '' ? restaurante_id : undefined;
      const produtos = restauranteId
        ? await ProdutoRepository.buscarTodos(restauranteId)
        : await ProdutoRepository.buscarTodos();
      return res.status(200).json(produtos);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao buscar produtos.' });
    }
  }

  // POST /api/produtos — ADMIN ou RESTAURANTE (dono do seu restaurante)
  static async criar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, descricao, preco, categoria, imagem_url, estoque, restaurante_id } = req.body;

      if (!nome || !preco) {
        return res.status(400).json({ mensagem: 'Nome e preço são obrigatórios.' });
      }

      const precoNumerico = Number(preco);
      if (preco === undefined || preco === null || preco === '' || Number.isNaN(precoNumerico)) {
        return res.status(400).json({ mensagem: 'Preço inválido.' });
      }

      let restauranteId: string | undefined;
      if (req.usuario?.role === 'RESTAURANTE') {
        const perfil = await RestauranteRepository.buscarPorUsuarioId(req.usuario!.id);
        if (!perfil?.id) {
          return res.status(403).json({ mensagem: 'Crie um perfil de restaurante antes de cadastrar produtos.' });
        }
        restauranteId = perfil.id;
      } else if (req.usuario?.role === 'ADMIN') {
        restauranteId = restaurante_id ?? undefined;
      }

      const produto = await ProdutoRepository.criar({
        nome,
        descricao,
        preco: precoNumerico,
        categoria,
        imagem_url,
        estoque,
        restaurante_id: restauranteId,
      });

      return res.status(201).json({ mensagem: 'Produto cadastrado com sucesso.', produto });
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      return res.status(500).json({ mensagem: 'Erro ao cadastrar produto.' });
    }
  }

  // PATCH /api/produtos/:id/status — ADMIN ou RESTAURANTE dono
  static async alterarStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { disponivel } = req.body;

      if (typeof disponivel !== 'boolean') {
        return res.status(400).json({ mensagem: 'O campo disponivel deve ser true ou false.' });
      }

      const produto = await ProdutoRepository.buscarPorId(id);
      if (!produto) {
        return res.status(404).json({ mensagem: 'Produto não encontrado.' });
      }

      const ehAdmin = req.usuario?.role === 'ADMIN';
      const ehDono = req.usuario?.role === 'RESTAURANTE' && produto.restaurante_usuario_id === req.usuario?.id;
      if (!ehAdmin && !ehDono) {
        return res.status(403).json({ mensagem: 'Sem permissão para alterar este produto.' });
      }

      const atualizado = await ProdutoRepository.atualizarStatus(id, disponivel);
      return res.status(200).json(atualizado);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar produto.' });
    }
  }

  // DELETE /api/produtos/:id — ADMIN ou RESTAURANTE dono
  static async deletar(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      const produto = await ProdutoRepository.buscarPorId(id);
      if (!produto) {
        return res.status(404).json({ mensagem: 'Produto não encontrado.' });
      }

      const ehAdmin = req.usuario?.role === 'ADMIN';
      const ehDono = req.usuario?.role === 'RESTAURANTE' && produto.restaurante_usuario_id === req.usuario?.id;
      if (!ehAdmin && !ehDono) {
        return res.status(403).json({ mensagem: 'Sem permissão para excluir este produto.' });
      }

      const removido = await ProdutoRepository.deletar(id);
      if (!removido) {
        return res.status(404).json({ mensagem: 'Produto não encontrado.' });
      }

      return res.status(200).json({ mensagem: 'Produto removido com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      return res.status(500).json({ mensagem: 'Erro ao excluir produto.' });
    }
  }
}
