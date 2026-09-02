import { api, mensagemErro } from './client';
import type { Role, Usuario } from '../types';

export interface RegistroInput {
  nome: string;
  email: string;
  senha: string;
  role: Role;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
}

export async function login(email: string, senha: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, senha });
  return data;
}

export async function registro(input: RegistroInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/registro', input);
  return data;
}

export async function loginComMensagem(email: string, senha: string) {
  try {
    return { ok: true as const, data: await login(email, senha) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}

export async function registroComMensagem(input: RegistroInput) {
  try {
    return { ok: true as const, data: await registro(input) };
  } catch (err) {
    return { ok: false as const, mensagem: mensagemErro(err) };
  }
}
