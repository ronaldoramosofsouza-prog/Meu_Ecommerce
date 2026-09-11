import { Router } from 'express';
import { EntregadorController } from '../controllers/EntregadorController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizarRole } from '../middlewares/autorizarRole';

const entregadorRoutes = Router();

entregadorRoutes.use(authMiddleware, autorizarRole('ENTREGADOR'));

entregadorRoutes.get('/entregador/perfil', EntregadorController.perfil);
entregadorRoutes.patch('/entregador/perfil', EntregadorController.atualizarPerfil);
entregadorRoutes.get('/entregador/minhas-entregas', EntregadorController.minhasEntregas);
entregadorRoutes.get('/entregador/historico', EntregadorController.historico);
entregadorRoutes.get('/entregador/estatisticas', EntregadorController.estatisticas);
entregadorRoutes.patch('/entregador/posicao', EntregadorController.atualizarPosicao);

export { entregadorRoutes };
