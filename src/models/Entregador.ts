export type StatusEntregador = 'DISPONIVEL' | 'EM_ENTREGA' | 'OFFLINE';

export interface Entregador {
  id?: number;
  usuario_id: string;
  placa_veiculo?: string;
  status: StatusEntregador;
  lat_atual?: number;
  lng_atual?: number;
  atualizado_em?: Date;
}

export interface PerfilEntregador extends Entregador {
  nome: string;
  email: string;
}

export interface EstatisticasEntregador {
  ganhos_hoje: number;
  entregas_hoje: number;
  ganhos_semana: number[]; // 7 posições, segunda a domingo
}
