import { pool } from '../config/database';

export type Role = 'CLIENTE' | 'ENTREGADOR' | 'ADMIN' | 'RESTAURANTE';

export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha_hash: string;
  role: Role;
  criado_em?: Date;
}

export class UsuarioRepository {
  // Buscar usuário por e-mail para validação de duplicidade e login
  static async buscarPorEmail(email: string): Promise<Usuario | null> {
    const query = 'SELECT id, nome, email, senha_hash, role, criado_em FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Criar novo usuário incluindo a role
  static async criar(usuario: Usuario): Promise<Usuario> {
    const query = `
      INSERT INTO usuarios (nome, email, senha_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome, email, role, criado_em
    `;
    const values = [usuario.nome, usuario.email, usuario.senha_hash, usuario.role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
