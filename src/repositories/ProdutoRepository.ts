import { pool } from '../config/database';
import { Produto } from '../models/Produto';

export class ProdutoRepository {
  static async criar(dados: Partial<Produto> & { nome: string; preco: number }): Promise<Produto> {
    const { rows } = await pool.query(
      `INSERT INTO produtos (nome, descricao, preco, categoria, disponivel, estoque, imagem_url, restaurante_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        dados.nome,
        dados.descricao ?? '',
        dados.preco,
        dados.categoria ?? 'GERAL',
        dados.disponivel ?? true,
        dados.estoque ?? 0,
        dados.imagem_url ?? '',
        dados.restaurante_id ?? null,
      ]
    );
    return rows[0];
  }

  static async buscarTodos(restauranteId?: string): Promise<Produto[]> {
    let query = `
      SELECT p.* FROM produtos p
      JOIN restaurantes r ON r.id = p.restaurante_id
      WHERE r.status = 'APROVADO' AND p.disponivel = TRUE`;
    const params: string[] = [];
    if (restauranteId) {
      params.push(restauranteId);
      query += ` AND p.restaurante_id = $${params.length}`;
    }
    query += ' ORDER BY p.criado_em DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async buscarPorId(id: string): Promise<(Produto & { restaurante_usuario_id?: string }) | null> {
    const { rows } = await pool.query(
      `SELECT p.*, r.usuario_id AS restaurante_usuario_id
       FROM produtos p
       LEFT JOIN restaurantes r ON r.id = p.restaurante_id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  static async atualizarStatus(id: string, disponivel: boolean): Promise<Produto | null> {
    const { rows } = await pool.query(
      `UPDATE produtos SET disponivel = $1 WHERE id = $2 RETURNING *`,
      [disponivel, id]
    );
    return rows[0] ?? null;
  }

  static async deletar(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM produtos WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
