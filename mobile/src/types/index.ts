// Tipos compartilhados do app — espelham o contrato da API do backend.
export type Role = 'CLIENTE' | 'ENTREGADOR' | 'ADMIN' | 'RESTAURANTE';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

export interface Restaurante {
  id: string;
  usuario_id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  endereco?: string | null;
  imagem_url?: string | null;
  status?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  criado_em?: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number | string;
  categoria?: string | null;
  imagem_url?: string | null;
  estoque?: number | null;
  disponivel?: boolean;
  restaurante_id?: string | null;
  restaurante_usuario_id?: string | null;
  restaurante_nome?: string | null;
}

export interface ItemPedido {
  id?: string;
  produto_id: string;
  nome?: string;
  quantidade: number;
  preco_unitario: number;
}

export interface Pedido {
  id: string;
  usuario_id?: string;
  entregador_id?: string | null;
  restaurante_id?: string | null;
  endereco_entrega?: string | null;
  status: string;
  metodo_pagamento?: string | null;
  valor_total?: number | string;
  criado_em?: string;
  restaurante_usuario_id?: string | null;
  entregador_usuario_id?: string | null;
  cliente_nome?: string | null;
  restaurante_nome?: string | null;
  entregador_nome?: string | null;
  itens?: ItemPedido[];
}

export const STATUS_ORDER: string[] = [
  'PENDENTE',
  'CONFIRMADO',
  'EM_PREPARO',
  'PRONTO',
  'EM_ROTA',
  'ENTREGUE',
  'CANCELADO',
];

export const LABEL_STATUS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const LABEL_ROLE: Record<Role, string> = {
  CLIENTE: 'Cliente',
  ENTREGADOR: 'Entregador',
  ADMIN: 'Administrador',
  RESTAURANTE: 'Restaurante',
};

export const FORMATA_PRECO = (valor: number | string | undefined | null): string => {
  const numero = Number(valor ?? 0);
  if (Number.isNaN(numero)) return 'R$ 0,00';
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
