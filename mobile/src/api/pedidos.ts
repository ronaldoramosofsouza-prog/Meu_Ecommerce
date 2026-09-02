import { api, mensagemErro } from './client';
import type { ItemPedido, Pedido } from '../types';

export interface CriarPedidoInput {
  itens: ItemPedido[];
  metodo_pagamento: string;
  endereco_entrega: string;
}

export async function criarPedido(input: CriarPedidoInput): Promise<Pedido> {
  const { data } = await api.post<Pedido>('/pedidos', input);
  return data;
}

export async function meusPedidos(): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/pedidos/meus-pedidos');
  return data;
}

export async function listarPedidos(): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/pedidos');
  return data;
}

export async function atualizarStatusPedido(id: string, status: string): Promise<Pedido> {
  const { data } = await api.patch<Pedido>(`/pedidos/${id}/status`, { status });
  return data;
}

export async function criarPedidoComMensagem(input: CriarPedidoInput) {
  try {
    return { ok: true as const, data: await criarPedido(input) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function atualizarStatusComMensagem(id: string, status: string) {
  try {
    return { ok: true as const, data: await atualizarStatusPedido(id, status) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}
