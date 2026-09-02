// Contexto de autenticação — persiste token e usuário no AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RegistroInput, loginComMensagem, registroComMensagem } from '../api/auth';
import { aoSessaoExpirada } from '../api/client';
import { clearToken, getToken, setToken } from '../config/api';
import { Usuario } from '../types';

const CHAVE_USUARIO = '@foodexpress/usuario';

export interface RespostaAuth {
  ok: boolean;
  mensagem?: string;
  usuario?: Usuario;
}

interface AuthContexto {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<RespostaAuth>;
  registro: (input: RegistroInput) => Promise<RespostaAuth>;
  logout: () => Promise<void>;
}

const Contexto = createContext<AuthContexto | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setTokenEstado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tok, usuarioJson] = await Promise.all([
          getToken(),
          AsyncStorage.getItem(CHAVE_USUARIO),
        ]);
        if (tok) setTokenEstado(tok);
        if (usuarioJson) setUsuario(JSON.parse(usuarioJson) as Usuario);
      } catch {
        // Sessão corrompida — começa deslogado.
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, senha: string): Promise<RespostaAuth> => {
    const res = await loginComMensagem(email, senha);
    if (!res.ok) return { ok: false, mensagem: res.mensagem };
    await setToken(res.data.token);
    await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(res.data.usuario));
    setTokenEstado(res.data.token);
    setUsuario(res.data.usuario);
    return { ok: true, usuario: res.data.usuario };
  }, []);

  const registro = useCallback(async (input: RegistroInput): Promise<RespostaAuth> => {
    const res = await registroComMensagem(input);
    if (!res.ok) return { ok: false, mensagem: res.mensagem };
    await setToken(res.data.token);
    await AsyncStorage.setItem(CHAVE_USUARIO, JSON.stringify(res.data.usuario));
    setTokenEstado(res.data.token);
    setUsuario(res.data.usuario);
    return { ok: true, usuario: res.data.usuario };
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    await AsyncStorage.removeItem(CHAVE_USUARIO);
    setTokenEstado(null);
    setUsuario(null);
  }, []);

  // Registra o listener de sessão expirada: o interceptor do client.ts chama
  // este callback após um 401, limpando o estado e voltando para o login.
  useEffect(() => {
    aoSessaoExpirada(() => {
      void logout();
    });
  }, [logout]);

  const valor = useMemo<AuthContexto>(
    () => ({ usuario, token, carregando, login, registro, logout }),
    [usuario, token, carregando, login, registro, logout],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
