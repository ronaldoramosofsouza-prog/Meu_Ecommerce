import { api, mensagemErro } from './client';
import type { Restaurante } from '../types';

export async function listarRestaurantes(): Promise<Restaurante[]> {
  const { data } = await api.get<Restaurante[]>('/restaurantes');
  return data;
}

export async function meuPerfil(): Promise<Restaurante | null> {
  const { data } = await api.get<Restaurante>('/restaurantes/meu-perfil');
  return data;
}

export async function criarPerfilRestaurante(input: {
  nome: string;
  descricao?: string;
  categoria?: string;
  endereco?: string;
  imagem_url?: string;
  lat?: number;
  lng?: number;
}): Promise<Restaurante> {
  const { data } = await api.post<Restaurante>('/restaurantes', input);
  return data;
}

export async function atualizarPerfilRestaurante(input: {
  nome?: string;
  descricao?: string;
  categoria?: string;
  endereco?: string;
  imagem_url?: string;
  lat?: number;
  lng?: number;
}): Promise<Restaurante> {
  const { data } = await api.patch<Restaurante>('/restaurantes/meu-perfil', input);
  return data;
}

export async function listarAdmin(): Promise<Restaurante[]> {
  const { data } = await api.get<Restaurante[]>('/restaurantes/admin');
  return data;
}

export async function aprovarRestaurante(id: string, status: 'APROVADO' | 'REJEITADO'): Promise<Restaurante> {
  const { data } = await api.patch<Restaurante>(`/restaurantes/${id}/aprovacao`, { status });
  return data;
}

export async function listarRestaurantesComMensagem() {
  try {
    return { ok: true as const, data: await listarRestaurantes() };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function meuPerfilComMensagem() {
  try {
    return { ok: true as const, data: await meuPerfil() };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function listarAdminComMensagem() {
  try {
    return { ok: true as const, data: await listarAdmin() };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function criarPerfilComMensagem(input: Parameters<typeof criarPerfilRestaurante>[0]) {
  try {
    return { ok: true as const, data: await criarPerfilRestaurante(input) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}
