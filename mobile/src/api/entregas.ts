import { api, mensagemErro } from './client';
import type { Pedido } from '../types';

export async function pedidosDisponiveis(): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/entregador/pedidos-disponiveis');
  return data;
}

export async function aceitarPedido(pedidoId: string): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/entregador/aceitar-pedido', { pedido_id: pedidoId });
  return data;
}

export async function pedidosDisponiveisComMensagem() {
  try {
    return { ok: true as const, data: await pedidosDisponiveis() };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function aceitarPedidoComMensagem(pedidoId: string) {
  try {
    return { ok: true as const, data: await aceitarPedido(pedidoId) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}
