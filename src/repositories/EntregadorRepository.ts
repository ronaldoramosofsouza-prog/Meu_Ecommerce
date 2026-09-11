import { pool } from '../config/database';
import { Entregador, EstatisticasEntregador, PerfilEntregador, StatusEntregador } from '../models/Entregador';

const CAMPOS = `id, usuario_id, placa_veiculo, status, lat_atual, lng_atual, atualizado_em`;

export class EntregadorRepository {
  // Cria o perfil de entregador (chamado no registro de um usuário com role ENTREGADOR).
  static async criarPerfil(usuarioId: string): Promise<Entregador> {
    const { rows } = await pool.query(
      `INSERT INTO entregadores (usuario_id, status)
       VALUES ($1, 'DISPONIVEL')
       RETURNING ${CAMPOS}`,
      [usuarioId]
    );
    return rows[0];
  }

  static async buscarPorUsuarioId(usuarioId: string): Promise<Entregador | null> {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM entregadores WHERE usuario_id = $1`, [usuarioId]);
    return rows[0] ?? null;
  }

  static async buscarPerfilComNome(usuarioId: string): Promise<PerfilEntregador | null> {
    const { rows } = await pool.query(
      `SELECT e.id, e.usuario_id, e.placa_veiculo, e.status, e.lat_atual, e.lng_atual, e.atualizado_em,
              u.nome, u.email
       FROM entregadores e
       JOIN usuarios u ON u.id = e.usuario_id
       WHERE e.usuario_id = $1`,
      [usuarioId]
    );
    return rows[0] ?? null;
  }

  static async atualizarPerfil(
    usuarioId: string,
    dados: { placa_veiculo?: string; status?: StatusEntregador }
  ): Promise<Entregador | null> {
    const { rows } = await pool.query(
      `UPDATE entregadores
       SET placa_veiculo = COALESCE($1, placa_veiculo),
           status = COALESCE($2, status),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE usuario_id = $3
       RETURNING ${CAMPOS}`,
      [dados.placa_veiculo ?? null, dados.status ?? null, usuarioId]
    );
    return rows[0] ?? null;
  }

  static async atualizarPosicao(usuarioId: string, lat: number, lng: number): Promise<Entregador | null> {
    const { rows } = await pool.query(
      `UPDATE entregadores
       SET lat_atual = $1, lng_atual = $2, atualizado_em = CURRENT_TIMESTAMP
       WHERE usuario_id = $3
       RETURNING ${CAMPOS}`,
      [lat, lng, usuarioId]
    );
    return rows[0] ?? null;
  }

  // Entregas atualmente em rota, atribuídas a este entregador.
  static async buscarMinhasEntregas(usuarioId: string): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT p.id, p.usuario_id, p.restaurante_id, p.entregador_id, p.endereco_entrega,
              p.valor_total, p.taxa_entrega, p.status, p.metodo_pagamento, p.criado_em,
              u.nome AS cliente_nome, r.nome AS restaurante_nome
       FROM pedidos p
       JOIN entregadores e ON e.id = p.entregador_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       WHERE e.usuario_id = $1 AND p.status = 'EM_ROTA'
       ORDER BY p.criado_em DESC`,
      [usuarioId]
    );
    return rows;
  }

  // Histórico de entregas concluídas/canceladas deste entregador.
  static async buscarHistorico(usuarioId: string, limite = 50): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT p.id, p.usuario_id, p.restaurante_id, p.entregador_id, p.endereco_entrega,
              p.valor_total, p.taxa_entrega, p.status, p.metodo_pagamento, p.criado_em, p.entregue_em,
              u.nome AS cliente_nome, r.nome AS restaurante_nome
       FROM pedidos p
       JOIN entregadores e ON e.id = p.entregador_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       WHERE e.usuario_id = $1 AND p.status IN ('ENTREGUE', 'CANCELADO')
       ORDER BY COALESCE(p.entregue_em, p.criado_em) DESC
       LIMIT $2`,
      [usuarioId, limite]
    );
    return rows;
  }

  static async buscarEstatisticas(usuarioId: string): Promise<EstatisticasEntregador> {
    const hoje = await pool.query(
      `SELECT COALESCE(SUM(p.taxa_entrega), 0) AS ganhos, COUNT(*) AS entregas
       FROM pedidos p
       JOIN entregadores e ON e.id = p.entregador_id
       WHERE e.usuario_id = $1 AND p.status = 'ENTREGUE' AND p.entregue_em::date = CURRENT_DATE`,
      [usuarioId]
    );

    // Semana corrente (segunda a domingo), uma linha por dia com entrega concluída.
    const semana = await pool.query(
      `SELECT EXTRACT(ISODOW FROM p.entregue_em)::int AS dia_semana,
              SUM(p.taxa_entrega) AS ganhos
       FROM pedidos p
       JOIN entregadores e ON e.id = p.entregador_id
       WHERE e.usuario_id = $1
         AND p.status = 'ENTREGUE'
         AND p.entregue_em >= date_trunc('week', CURRENT_DATE)
         AND p.entregue_em < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
       GROUP BY dia_semana`,
      [usuarioId]
    );

    const ganhosSemana = [0, 0, 0, 0, 0, 0, 0];
    for (const row of semana.rows) {
      // ISODOW: 1 = segunda ... 7 = domingo → índice 0..6
      const indice = Number(row.dia_semana) - 1;
      if (indice >= 0 && indice < 7) {
        ganhosSemana[indice] = Number(row.ganhos);
      }
    }

    return {
      ganhos_hoje: Number(hoje.rows[0]?.ganhos ?? 0),
      entregas_hoje: Number(hoje.rows[0]?.entregas ?? 0),
      ganhos_semana: ganhosSemana,
    };
  }
}
