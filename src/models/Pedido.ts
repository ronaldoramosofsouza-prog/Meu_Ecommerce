export type StatusPedido = 'PENDENTE' | 'CONFIRMADO' | 'EM_PREPARO' | 'PRONTO' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO';

export interface ItemPedidoInput {
  produto_id: string;
  quantidade: number;
}

export interface ItemPedido {
  id?: string;
  pedido_id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
}

export interface Pedido {
  id?: string;
  usuario_id: string;
  restaurante_id?: string;
  entregador_id?: string;
  endereco_entrega?: string;
  valor_total: number;
  status: StatusPedido;
  metodo_pagamento: string;
  itens?: ItemPedido[];
  criado_em?: Date;
}
