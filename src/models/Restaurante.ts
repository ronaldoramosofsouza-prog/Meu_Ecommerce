export type RestauranteStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export interface Restaurante {
  id?: string;
  usuario_id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  endereco?: string;
  imagem_url?: string;
  status: RestauranteStatus;
  lat?: number;
  lng?: number;
  criado_em?: Date;
}