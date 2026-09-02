import { api, mensagemErro } from './client';
import type { Produto } from '../types';

export interface CriarProdutoInput {
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  imagem_url?: string;
  estoque?: number;
  restaurante_id?: string;
}

export async function listarProdutos(restauranteId?: string): Promise<Produto[]> {
  const { data } = await api.get<Produto[]>('/produtos', {
    params: restauranteId ? { restaurante_id: restauranteId } : undefined,
  });
  return data;
}

export async function criarProduto(input: CriarProdutoInput) {
  const { data } = await api.post<{ mensagem: string; produto: Produto }>('/produtos', input);
  return data;
}

// PATCH /produtos/:id/status — body apenas { disponivel } e retorna o produto atualizado diretamente
export async function alterarDisponibilidade(id: string, disponivel: boolean): Promise<Produto> {
  const { data } = await api.patch<Produto>(`/produtos/${id}/status`, { disponivel });
  return data;
}

export async function deletarProduto(id: string): Promise<{ mensagem: string }> {
  const { data } = await api.delete<{ mensagem: string }>(`/produtos/${id}`);
  return data;
}

export async function listarProdutosComMensagem(restauranteId?: string) {
  try {
    return { ok: true as const, data: await listarProdutos(restauranteId) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function criarProdutoComMensagem(input: CriarProdutoInput) {
  try {
    return { ok: true as const, data: await criarProduto(input) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}
