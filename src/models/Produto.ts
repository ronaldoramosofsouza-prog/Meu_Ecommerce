export interface Produto {
  id?: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
  estoque: number;
  categoria?: string;
  disponivel: boolean;
  restaurante_id?: string;
  criado_em?: Date;
}
