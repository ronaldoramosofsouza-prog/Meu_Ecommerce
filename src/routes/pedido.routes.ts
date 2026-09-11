import { Router } from 'express';
import { PedidoController } from '../controllers/PedidoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { autorizarRole } from '../middlewares/autorizarRole';

const pedidoRoutes = Router();

// Cliente
pedidoRoutes.post('/pedidos', authMiddleware, PedidoController.criar);
pedidoRoutes.get('/pedidos/meus-pedidos', authMiddleware, PedidoController.listarMeusPedidos);

// Admin e restaurante (dono) visualizam os pedidos
pedidoRoutes.get('/pedidos', authMiddleware, autorizarRole('ADMIN', 'RESTAURANTE'), PedidoController.listarTodos);

// Detalhe completo (autorização por dono/entregador/admin é checada no controller)
pedidoRoutes.get('/pedidos/:id', authMiddleware, PedidoController.buscarPorId);

// Transições de status por papel (admin, restaurante dono, entregador do pedido)
pedidoRoutes.patch(
  '/pedidos/:id/status',
  authMiddleware,
  autorizarRole('ADMIN', 'RESTAURANTE', 'ENTREGADOR'),
  PedidoController.atualizarStatus
);

// Entregador
pedidoRoutes.get(
  '/entregador/pedidos-disponiveis',
  authMiddleware,
  autorizarRole('ENTREGADOR'),
  PedidoController.listarDisponiveis
);
pedidoRoutes.post(
  '/entregador/aceitar-pedido',
  authMiddleware,
  autorizarRole('ENTREGADOR'),
  PedidoController.aceitarPedido
);

export { pedidoRoutes };
