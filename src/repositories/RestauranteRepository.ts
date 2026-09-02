import { pool } from '../config/database';
import { Restaurante, RestauranteStatus } from '../models/Restaurante';

const CAMPOS = `
  id, usuario_id, nome, descricao, categoria, endereco, imagem_url,
  status, lat, lng, criado_em
`;

export class RestauranteRepository {
  static async criar(dados: Partial<Restaurante> & { usuario_id: string; nome: string }): Promise<Restaurante> {
    const { rows } = await pool.query(
      `INSERT INTO restaurantes (usuario_id, nome, descricao, categoria, endereco, imagem_url, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${CAMPOS}`,
      [
        dados.usuario_id,
        dados.nome,
        dados.descricao ?? null,
        dados.categoria ?? null,
        dados.endereco ?? null,
        dados.imagem_url ?? null,
        dados.lat ?? null,
        dados.lng ?? null,
      ]
    );
    return rows[0];
  }

  static async buscarPorId(id: string): Promise<Restaurante | null> {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM restaurantes WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  static async buscarPorUsuarioId(usuarioId: string): Promise<Restaurante | null> {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM restaurantes WHERE usuario_id = $1`, [usuarioId]);
    return rows[0] ?? null;
  }

  static async buscarTodos(): Promise<Restaurante[]> {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM restaurantes ORDER BY criado_em DESC`);
    return rows;
  }

  static async buscarAprovados(): Promise<Restaurante[]> {
    const { rows } = await pool.query(
      `SELECT ${CAMPOS} FROM restaurantes WHERE status = 'APROVADO' ORDER BY nome`
    );
    return rows;
  }

  static async atualizarStatus(id: string, status: RestauranteStatus): Promise<Restaurante | null> {
    const { rows } = await pool.query(
      `UPDATE restaurantes SET status = $1 WHERE id = $2 RETURNING ${CAMPOS}`,
      [status, id]
    );
    return rows[0] ?? null;
  }

  static async atualizar(id: string, dados: Partial<Restaurante>): Promise<Restaurante | null> {
    const { rows } = await pool.query(
      `UPDATE restaurantes
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           categoria = COALESCE($3, categoria),
           endereco = COALESCE($4, endereco),
           imagem_url = COALESCE($5, imagem_url),
           lat = COALESCE($6, lat),
           lng = COALESCE($7, lng)
       WHERE id = $8
       RETURNING ${CAMPOS}`,
      [
        dados.nome ?? null,
        dados.descricao ?? null,
        dados.categoria ?? null,
        dados.endereco ?? null,
        dados.imagem_url ?? null,
        dados.lat ?? null,
        dados.lng ?? null,
        id,
      ]
    );
    return rows[0] ?? null;
  }
}