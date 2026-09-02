import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { atualizarStatusComMensagem } from '../../../src/api/pedidos';
import MapaRastreamento from '../../../src/components/MapaRastreamento';
import { conectarSocket, entrarSalaPedido, onStatusAlterado } from '../../../src/socket';
import { FORMATA_PRECO, Pedido } from '../../../src/types';

export default function DetalheEntrega() {
  const router = useRouter();
  const { id, pedido } = useLocalSearchParams<{ id: string; pedido?: string }>();
  const [dados, setDados] = useState<Pedido | null>(null);
  const [concluindo, setConcluindo] = useState(false);
  const concluido = useRef(false);

  useEffect(() => {
    let ativo = true;
    let removerOuvinte: (() => void) | null = null;

    conectarSocket().catch(() => {});
    entrarSalaPedido(id);

    removerOuvinte = onStatusAlterado((payload) => {
      if (!ativo) return;
      const pertence = 'id' in payload ? payload.id === id : payload.pedidoId === id;
      if (!pertence) return;
      if (payload.status === 'ENTREGUE') concluir();
    });

    return () => {
      ativo = false;
      removerOuvinte?.();
    };
  }, [id]);

  useEffect(() => {
    if (!pedido) return;
    try {
      const parseado = JSON.parse(pedido) as Pedido;
      setDados((atual) => atual ?? parseado);
    } catch {
      // parâmetro inválido; ignora e mantém sem dados iniciais
    }
  }, [pedido]);

  const concluir = () => {
    if (concluido.current) return;
    concluido.current = true;
    Alert.alert('Entrega concluída', 'O pedido foi marcado como entregue.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const marcarEntregue = async () => {
    if (concluindo) return;
    setConcluindo(true);
    try {
      const res = await atualizarStatusComMensagem(id, 'ENTREGUE');
      if (res.ok) {
        concluir();
      } else {
        Alert.alert('Atenção', res.mensagem);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível marcar a entrega como concluída.');
    } finally {
      setConcluindo(false);
    }
  };

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.titulo}>Detalhe da entrega</Text>

      {dados ? (
        <View style={estilos.cartao}>
          <Text style={estilos.nome}>{dados.cliente_nome ?? 'Cliente'}</Text>
          <Text style={estilos.info}>Restaurante: {dados.restaurante_nome ?? '—'}</Text>
          <Text style={estilos.info}>Endereço: {dados.endereco_entrega ?? '—'}</Text>
          <Text style={estilos.preco}>{FORMATA_PRECO(dados.valor_total)}</Text>
        </View>
      ) : (
        <ActivityIndicator size="large" color="#DC2626" style={estilos.carregando} />
      )}

      <Text style={estilos.secao}>Rastreamento</Text>
      <MapaRastreamento pedidoId={id} modo="entregador" />

      <TouchableOpacity
        style={[estilos.botao, concluindo && estilos.botaoInativo]}
        activeOpacity={0.7}
        disabled={concluindo}
        onPress={marcarEntregue}
      >
        {concluindo ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={estilos.botaoTexto}>Marcar como entregue</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  conteudo: { padding: 16, paddingBottom: 32 },
  titulo: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  nome: { color: '#111827', fontSize: 16, fontWeight: '700' },
  info: { color: '#374151', fontSize: 13, marginTop: 4 },
  preco: { color: '#DC2626', fontSize: 16, fontWeight: '700', marginTop: 8 },
  carregando: { marginVertical: 24 },
  secao: { color: '#374151', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  botao: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 14,
  },
  botaoInativo: { opacity: 0.6 },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
