import { io, Socket } from 'socket.io-client';
import { API_URL, getToken } from '../config/api';
import type { Pedido } from '../types';

type OuvinteStatusAlterado = (payload: Pedido | { pedidoId?: string; status: string }) => void;
type OuvintePedidoNovo = (pedido: Pedido) => void;
type OuvintePedidoDisponivel = (pedido: Pedido) => void;
type OuvinteGpsCliente = (payload: { pedidoId: string; lat: number; lng: number }) => void;

let socket: Socket | null = null;
let conectando = false;
let filaAposConectar: Array<() => void> = [];

const ouvintes = {
  'pedido:novo': new Set<OuvintePedidoNovo>(),
  status_alterado: new Set<OuvinteStatusAlterado>(),
  novo_pedido_disponivel: new Set<OuvintePedidoDisponivel>(),
  atualizacao_gps_cliente: new Set<OuvinteGpsCliente>(),
};

function aplicarOuvintes(s: Socket) {
  s.on('pedido:novo', (pedido: Pedido) => {
    ouvintes['pedido:novo'].forEach((fn) => fn(pedido));
  });
  s.on('status_alterado', (payload: Pedido | { pedidoId?: string; status: string }) => {
    ouvintes.status_alterado.forEach((fn) => fn(payload));
  });
  s.on('novo_pedido_disponivel', (pedido: Pedido) => {
    ouvintes.novo_pedido_disponivel.forEach((fn) => fn(pedido));
  });
  s.on('atualizacao_gps_cliente', (payload: { pedidoId: string; lat: number; lng: number }) => {
    ouvintes.atualizacao_gps_cliente.forEach((fn) => fn(payload));
  });
}

function processarFila() {
  const pendentes = filaAposConectar;
  filaAposConectar = [];
  pendentes.forEach((fn) => fn());
}

/**
 * Conecta o socket usando o token salvo. Pode ser chamado várias vezes;
 * já estando conectado, apenas retorna a instância.
 */
export async function conectarSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  if (conectando) {
    return new Promise<Socket>((resolve) => {
      const verificar = () => {
        if (socket?.connected) {
          resolve(socket);
        } else {
          setTimeout(verificar, 100);
        }
      };
      verificar();
    });
  }

  conectando = true;
  try {
    const token = await getToken();
    socket = io(API_URL, {
      transports: ['websocket'],
      auth: { token: token ?? undefined },
    });
    aplicarOuvintes(socket);
    socket.on('connect', processarFila);
    return socket;
  } finally {
    conectando = false;
  }
}

export function desconectarSocket() {
  socket?.disconnect();
  socket = null;
}

/** Registra um listener por evento. Retorna função para remover. */
export function onPedidoNovo(fn: OuvintePedidoNovo): () => void {
  ouvintes['pedido:novo'].add(fn);
  return () => ouvintes['pedido:novo'].delete(fn);
}
export function onStatusAlterado(fn: OuvinteStatusAlterado): () => void {
  ouvintes.status_alterado.add(fn);
  return () => ouvintes.status_alterado.delete(fn);
}
export function onNovoPedidoDisponivel(fn: OuvintePedidoDisponivel): () => void {
  ouvintes.novo_pedido_disponivel.add(fn);
  return () => ouvintes.novo_pedido_disponivel.delete(fn);
}
export function onGpsCliente(fn: OuvinteGpsCliente): () => void {
  ouvintes.atualizacao_gps_cliente.add(fn);
  return () => ouvintes.atualizacao_gps_cliente.delete(fn);
}

function emitirQuandoConectado(evento: string, ...args: unknown[]) {
  if (socket?.connected) {
    socket.emit(evento, ...args);
    return;
  }
  // Enfileira até a conexão voltar; descarta se o socket for desconectado.
  filaAposConectar.push(() => socket?.connected && socket.emit(evento, ...args));
}

/** Cliente entra na sala do pedido para receber status_alterado. */
export function entrarSalaPedido(pedidoId: string) {
  emitirQuandoConectado('entrar_sala_pedido', pedidoId);
}

/** Entregador envia a posição GPS de um pedido em rota. */
export function enviarPosicaoGps(pedidoId: string, lat: number, lng: number) {
  emitirQuandoConectado('enviar_posicao_gps', { pedidoId, lat, lng });
}

/** Qualquer papel pode disparar a mudança de status via socket. */
export function alterarStatusPedidoSocket(pedidoId: string, status: string) {
  emitirQuandoConectado('alterar_status_pedido', { pedidoId, status });
}

export { socket };
