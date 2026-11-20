import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizarRole } from '../middlewares/autorizarRole';

const produtoRoutes = Router();

// Rota pública para listar produtos no App
produtoRoutes.get('/produtos', ProdutoController.listar);

// RESTAURANTE: seus próprios produtos, inclusive indisponíveis
produtoRoutes.get('/produtos/meus', authMiddleware, autorizarRole('RESTAURANTE'), ProdutoController.meusProdutos);

// Detalhe de um produto (para pré-preencher o formulário de edição)
produtoRoutes.get('/produtos/:id', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.buscarPorId);

// Rotas restritas para ADMIN ou RESTAURANTE (dono do restaurante)
produtoRoutes.post('/produtos', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.criar);
produtoRoutes.patch('/produtos/:id', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.atualizar);
produtoRoutes.patch('/produtos/:id/status', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.alterarStatus);
produtoRoutes.delete('/produtos/:id', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.deletar);

export { produtoRoutes };
