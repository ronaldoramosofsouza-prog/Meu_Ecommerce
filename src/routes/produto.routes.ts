import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizarRole } from '../middlewares/autorizarRole';

const produtoRoutes = Router();

// Rota pública para listar produtos no App
produtoRoutes.get('/produtos', ProdutoController.listar);

// Rotas restritas para ADMIN ou RESTAURANTE (dono do restaurante)
produtoRoutes.post('/produtos', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.criar);
produtoRoutes.patch('/produtos/:id/status', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.alterarStatus);
produtoRoutes.delete('/produtos/:id', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), ProdutoController.deletar);

export { produtoRoutes };
