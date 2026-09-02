import { StyleSheet, Text, View } from 'react-native';
import { LABEL_STATUS } from '../types';

interface Props {
  status: string;
}

const CORES: Record<string, { fundo: string; texto: string }> = {
  PENDENTE: { fundo: '#FEF3C7', texto: '#92400E' },
  CONFIRMADO: { fundo: '#DBEAFE', texto: '#1E40AF' },
  EM_PREPARO: { fundo: '#EDE9FE', texto: '#6D28D9' },
  PRONTO: { fundo: '#A7F3D0', texto: '#065F46' },
  EM_ROTA: { fundo: '#FFE4E6', texto: '#9F1239' },
  ENTREGUE: { fundo: '#D1FAE5', texto: '#047857' },
  CANCELADO: { fundo: '#FEE2E2', texto: '#991B1B' },
  APROVADO: { fundo: '#D1FAE5', texto: '#047857' },
  REJEITADO: { fundo: '#FEE2E2', texto: '#991B1B' },
};

export default function StatusBadge({ status }: Props) {
  const cor = CORES[status] ?? { fundo: '#F3F4F6', texto: '#374151' };
  const rotulo = LABEL_STATUS[status] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <View style={[estilos.wrapper, { backgroundColor: cor.fundo }]}>
      <Text style={[estilos.texto, { color: cor.texto }]}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
  },
});
