import axios from 'axios';
import { API_URL, getToken, clearToken } from '../config/api';

// Callback de sessão expirada — registrado pelo AuthContext para resetar o
// estado de autenticação. Evita import circular (AuthContext importa client).
type ListenerSessaoExpirada = () => void;
let listenerSessaoExpirada: ListenerSessaoExpirada | null = null;

export function aoSessaoExpirada(fn: ListenerSessaoExpirada): void {
  listenerSessaoExpirada = fn;
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      // Notifica o AuthContext para limpar o estado (usuario/token) e
      // redirecionar para a tela de login automaticamente.
      listenerSessaoExpirada?.();
    }
    return Promise.reject(error);
  },
);

export function mensagemErro(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { mensagem?: string } | undefined;
    if (data?.mensagem) return data.mensagem;
    if (!err.response) return 'Sem conexão com o servidor.';
    return `Erro ${err.response.status}`;
  }
  return 'Ocorreu um erro inesperado.';
}
