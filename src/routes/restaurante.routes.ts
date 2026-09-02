import { Router } from 'express';
import { RestauranteController } from '../controllers/RestauranteController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizarRole } from '../middlewares/autorizarRole';

const restauranteRoutes = Router();

// Público: lista apenas restaurantes APROVADOS (para o app do cliente)
restauranteRoutes.get('/restaurantes', RestauranteController.listar);

// RESTAURANTE (dono): cria o perfil e gerencia os próprios dados
restauranteRoutes.post('/restaurantes', authMiddleware, autorizarRole('RESTAURANTE'), RestauranteController.cadastrar);
restauranteRoutes.get('/restaurantes/meu-perfil', authMiddleware, autorizarRole('RESTAURANTE'), RestauranteController.meuPerfil);
restauranteRoutes.patch('/restaurantes/meu-perfil', authMiddleware, autorizarRole('RESTAURANTE'), RestauranteController.atualizar);

// ADMIN: lista todos e aprova/rejeita
restauranteRoutes.get('/restaurantes/admin', authMiddleware, autorizarRole('ADMIN'), RestauranteController.listarTodos);
restauranteRoutes.patch('/restaurantes/:id/aprovacao', authMiddleware, autorizarRole('ADMIN'), RestauranteController.aprovarRejeitar);

export { restauranteRoutes };