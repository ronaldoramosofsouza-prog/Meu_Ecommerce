// Carrega o .env ANTES de qualquer outro módulo: módulos importados abaixo
// (authMiddleware, AuthController) leem process.env.JWT_SECRET em nível de módulo.
import 'dotenv/config';

import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import { authRoutes } from './routes/auth.routes';
import { produtoRoutes } from './routes/produto.routes';
import { pedidoRoutes } from './routes/pedido.routes';
import { restauranteRoutes } from './routes/restaurante.routes';
import { db } from './config/database';
import { UsuarioPayload } from './middlewares/authMiddleware';
import { PedidoRepository } from './repositories/PedidoRepository';
import { STATUS_VALIDOS, TRANSICOES_RESTAURANTE, TRANSICOES_ENTREGADOR } from './constants/pedidoStatus';
import { StatusPedido } from './models/Pedido';
// 1. Import do seed do Admin
import { criarAdminInicial } from './config/seedAdmin';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Falha rápida se JWT_SECRET não estiver definido — nada de fallback inseguro.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Configure a variável de ambiente JWT_SECRET.');
}

// CORS: permitir apenas origens explícitas via CORS_ORIGINS (separadas por vírgula).
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origem) => origem.trim())
  : '*';

export const io = new Server(server, {
  cors: { origin: corsOrigins, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
});

app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(express.static('public'));

// Registro centralizado das Rotas HTTP
app.use('/api', authRoutes);
app.use('/api', produtoRoutes);
app.use('/api', pedidoRoutes);
app.use('/api', restauranteRoutes);

// Tratador global de erros — registrado DEPOIS das rotas: captura erros
// síncronos e next(err) não tratados, respondendo sempre com { mensagem }.
// Express exige os 4 parâmetros (err, req, res, next) para reconhecer como error handler.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ mensagem: 'Erro interno no servidor.' });
});

// Middleware de Autenticação para WebSockets
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Autenticação necessária'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UsuarioPayload;
    (socket as any).usuario = decoded;
    next();
  } catch (err) {
    return next(new Error('Token inválido ou expirado'));
  }
});

// Eventos em Tempo Real
io.on('connection', (socket: Socket) => {
  const usuario = (socket as any).usuario as UsuarioPayload;
  console.log(`⚡ Conectado: ${usuario?.email} [${usuario?.role}] (Socket: ${socket.id})`);

  // Se for ADMIN, entra na sala global de monitoramento (Kanban)
  if (usuario?.role === 'ADMIN') {
    socket.join('admins');
  }

  // Se for RESTAURANTE, entra na sala própria para receber pedido:novo
  if (usuario?.role === 'RESTAURANTE') {
    db.query('SELECT id FROM restaurantes WHERE usuario_id = $1', [usuario.id])
      .then((res) => { if (res.rows[0]?.id) socket.join(`restaurante_${res.rows[0].id}`); })
      .catch((err) => console.error('Erro ao registrar sala do restaurante:', err));
  }

  // Se for ENTREGADOR, entra na sala onde pedidos PRONTOS são anunciados
  if (usuario?.role === 'ENTREGADOR') {
    socket.join('entregadores');
  }

  // Entrar na sala individual do pedido — somente com autorização
  // (cliente dono, restaurante dono, entregador do pedido ou admin)
  socket.on('entrar_sala_pedido', async (pedidoId: string | number) => {
    try {
      const pedido = await PedidoRepository.buscarPorId(String(pedidoId));
      if (!pedido) {
        socket.emit('erro_autorizacao', { mensagem: 'Pedido não encontrado.' });
        return;
      }

      const ehAdmin = usuario?.role === 'ADMIN';
      const ehClienteDono = pedido.usuario_id === usuario?.id;
      const ehRestauranteDono = pedido.restaurante_usuario_id === usuario?.id;
      const ehEntregadorDoPedido = pedido.entregador_usuario_id === usuario?.id;

      if (!ehAdmin && !ehClienteDono && !ehRestauranteDono && !ehEntregadorDoPedido) {
        socket.emit('erro_autorizacao', { mensagem: 'Você não pode acompanhar este pedido.' });
        return;
      }

      socket.join(`pedido_${pedidoId}`);
      console.log(`Socket ${socket.id} entrou na sala do pedido_${pedidoId}`);
    } catch (err) {
      console.error('Erro ao entrar na sala do pedido:', err);
      socket.emit('erro_autorizacao', { mensagem: 'Erro ao entrar na sala do pedido.' });
    }
  });

  // GPS do Entregador — somente entregadores vinculados ao pedido podem enviar posição
  socket.on('enviar_posicao_gps', async (data: { pedidoId: string | number; lat: number; lng: number }) => {
    const { pedidoId, lat, lng } = data;

    if (usuario?.role !== 'ENTREGADOR') {
      socket.emit('erro_dados', { mensagem: 'Apenas entregadores podem enviar posição GPS.' });
      return;
    }
    if (!pedidoId || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      socket.emit('erro_dados', { mensagem: 'Dados de posição inválidos.' });
      return;
    }

    try {
      const pedido = await PedidoRepository.buscarPorId(String(pedidoId));
      if (!pedido) {
        socket.emit('erro_dados', { mensagem: 'Pedido não encontrado.' });
        return;
      }
      if (pedido.entregador_usuario_id !== usuario?.id) {
        socket.emit('erro_dados', { mensagem: 'Este pedido não está atribuído a você.' });
        return;
      }

      // Notifica o cliente na sala do pedido e os admins no mapa global
      io.to(`pedido_${pedidoId}`).emit('atualizacao_gps_cliente', { pedidoId, lat, lng });
      io.to('admins').emit('atualizacao_gps_admin', { entregadorId: usuario.id, pedidoId, lat, lng });

      await db.query(
        `UPDATE entregadores
         SET lat_atual = $1, lng_atual = $2, atualizado_em = CURRENT_TIMESTAMP
         WHERE usuario_id = $3`,
        [lat, lng, usuario.id]
      );
    } catch (err) {
      console.error('Erro ao atualizar GPS no banco:', err);
      socket.emit('erro_dados', { mensagem: 'Erro ao atualizar posição.' });
    }
  });

  // Alteração de status em tempo real — mesma validação de papéis e transições da API HTTP
  socket.on(
    'alterar_status_pedido',
    async (data: { pedidoId: string | number; novoStatus?: string; status?: string }) => {
      const { pedidoId } = data;
      const status = data.novoStatus ?? data.status ?? '';

      try {
        if (!pedidoId || !(STATUS_VALIDOS as string[]).includes(status)) {
          socket.emit('status_alterado_erro', { mensagem: 'Status inválido.' });
          return;
        }

        const pedido = await PedidoRepository.buscarPorId(String(pedidoId));
        if (!pedido) {
          socket.emit('status_alterado_erro', { mensagem: 'Pedido não encontrado.' });
          return;
        }

        const ehAdmin = usuario?.role === 'ADMIN';
        const ehRestauranteDono =
          usuario?.role === 'RESTAURANTE' && pedido.restaurante_usuario_id === usuario?.id;
        const ehEntregadorDoPedido =
          usuario?.role === 'ENTREGADOR' && pedido.entregador_usuario_id === usuario?.id;

        let podeTransicionar = false;
        if (ehAdmin) {
          podeTransicionar = true;
        } else if (ehRestauranteDono) {
          podeTransicionar = (TRANSICOES_RESTAURANTE[pedido.status] as string[] | undefined)?.includes(status) ?? false;
        } else if (ehEntregadorDoPedido) {
          podeTransicionar = (TRANSICOES_ENTREGADOR[pedido.status] as string[] | undefined)?.includes(status) ?? false;
        }

        if (!podeTransicionar) {
          socket.emit('status_alterado_erro', { mensagem: 'Transição de status não permitida para este perfil.' });
          return;
        }

        const pedidoAtualizado = await PedidoRepository.atualizarStatus(String(pedidoId), status as StatusPedido);

        io.to(`pedido_${pedidoId}`).emit('status_alterado', pedidoAtualizado);
        io.to('admins').emit('status_alterado', pedidoAtualizado);
        if (pedidoAtualizado?.restaurante_id) {
          io.to(`restaurante_${pedidoAtualizado.restaurante_id}`).emit('status_alterado', pedidoAtualizado);
        }

        // Avisa os entregadores apenas quando o pedido fica PRONTO
        if (status === 'PRONTO') {
          io.to('entregadores').emit('novo_pedido_disponivel', pedidoAtualizado);
        }
      } catch (err) {
        console.error('Erro ao alterar status:', err);
        socket.emit('status_alterado_erro', { mensagem: 'Erro ao alterar status do pedido.' });
      }
    }
  );

  socket.on('disconnect', () => {
    console.log(`❌ Desconectado: ${socket.id}`);
  });
});

// Inicialização do Servidor e Seed do Admin
server.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);

  // Executa a criação automática do usuário administrador inicial
  await criarAdminInicial();
});
