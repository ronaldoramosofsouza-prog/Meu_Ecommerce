import { StatusPedido } from '../models/Pedido';

// Transições permitidas por papel no fluxo de status do pedido.
// Compartilhadas entre o PedidoController (HTTP) e o handler de Socket.IO
// para que a validação via realtime seja idêntica à da API.
export const TRANSICOES_RESTAURANTE: Record<string, StatusPedido[]> = {
  PENDENTE: ['CONFIRMADO'],
  CONFIRMADO: ['EM_PREPARO'],
  EM_PREPARO: ['PRONTO'],
};

export const TRANSICOES_ENTREGADOR: Record<string, StatusPedido[]> = {
  PRONTO: ['EM_ROTA'],
  EM_ROTA: ['ENTREGUE'],
};

export const STATUS_VALIDOS: StatusPedido[] = ['PENDENTE','CONFIRMADO','EM_PREPARO','PRONTO','EM_ROTA','ENTREGUE','CANCELADO'];