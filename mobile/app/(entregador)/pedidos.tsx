import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  aceitarPedidoComMensagem,
  pedidosDisponiveisComMensagem,
} from '../../src/api/entregas';
import { conectarSocket, onNovoPedidoDisponivel } from '../../src/socket';
import { FORMATA_PRECO, Pedido } from '../../src/types';

export default function PedidosDisponiveis() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await pedidosDisponiveisComMensagem();
      if (res.ok) setPedidos(res.data);
    } catch {
      setPedidos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  useEffect(() => {
    let ativo = true;
    conectarSocket().catch(() => {});
    const remover = onNovoPedidoDisponivel(() => {
      if (ativo) carregar();
    });
    return () => {
      ativo = false;
      remover();
    };
  }, [carregar]);

  const aceitar = (pedido: Pedido) => {
    Alert.alert(
      'Aceitar entrega',
      `Deseja aceitar a entrega do pedido para ${pedido.endereco_entrega ?? 'o cliente'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            try {
              const res = await aceitarPedidoComMensagem(pedido.id);
              if (res.ok) {
                router.push({
                  pathname: '/entrega/[id]',
                  params: { id: pedido.id, pedido: JSON.stringify(res.data) },
                });
              } else {
                Alert.alert('Atenção', res.mensagem);
                carregar();
              }
            } catch {
              Alert.alert('Erro', 'Não foi possível aceitar a entrega.');
            }
          },
        },
      ]
    );
  };

  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <Text style={estilos.titulo}>Pedidos prontos para entrega</Text>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <View style={estilos.cartao}>
            <Text style={estilos.nome}>
              {item.restaurante_nome ?? 'Restaurante'}
            </Text>
            {item.endereco_entrega ? (
              <Text style={estilos.endereco}>{item.endereco_entrega}</Text>
            ) : null}
            {item.cliente_nome ? (
              <Text style={estilos.info}>Cliente: {item.cliente_nome}</Text>
            ) : null}
            <Text style={estilos.info}>
              Itens:{' '}
              {(item.itens ?? []).reduce((soma, i) => soma + i.quantidade, 0)}
            </Text>
            <Text style={estilos.preco}>{FORMATA_PRECO(item.valor_total)}</Text>
            <TouchableOpacity
              style={estilos.botaoAceitar}
              activeOpacity={0.7}
              onPress={() => aceitar(item)}
            >
              <Text style={estilos.botaoTexto}>Aceitar entrega</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={estilos.vazio}>
            Nenhum pedido pronto para entrega no momento.
          </Text>
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1, padding: 16 },
  centro: { alignItems: 'center', backgroundColor: '#F9FAFB', flex: 1, justifyContent: 'center' },
  titulo: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  lista: { paddingBottom: 24 },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  nome: { color: '#111827', fontSize: 16, fontWeight: '700' },
  endereco: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  info: { color: '#374151', fontSize: 13, marginTop: 4 },
  preco: { color: '#DC2626', fontSize: 16, fontWeight: '700', marginTop: 8 },
  botaoAceitar: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  vazio: { color: '#6B7280', fontSize: 14, marginTop: 24, textAlign: 'center' },
});
