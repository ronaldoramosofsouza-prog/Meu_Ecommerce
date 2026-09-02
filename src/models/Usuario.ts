export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha_hash: string;
  criado_em?: Date;
}

export interface UsuarioResponse {
  id: string;
  nome: string;
  email: string;
  criado_em?: Date;
}
