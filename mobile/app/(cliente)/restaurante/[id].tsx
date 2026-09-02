import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { listarProdutosComMensagem } from '../../../src/api/produtos';
import { listarRestaurantesComMensagem } from '../../../src/api/restaurantes';
import ProdutoCard from '../../../src/components/ProdutoCard';
import { useCarrinho } from '../../../src/context/CarrinhoContext';
import { Produto, Restaurante } from '../../../src/types';

export default function TelaRestaurante() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { quantidadeTotal } = useCarrinho();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!id) return;
    const [resProdutos, resRestaurantes] = await Promise.all([
      listarProdutosComMensagem(id),
      listarRestaurantesComMensagem(),
    ]);
    if (resProdutos.ok) {
      setProdutos(resProdutos.data);
      setErro(null);
    } else {
      setErro(resProdutos.mensagem ?? 'Não foi possível carregar o cardápio.');
    }
    if (resRestaurantes.ok) {
      setRestaurante(resRestaurantes.data.find((r) => r.id === id) ?? null);
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  async function aoAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  if (carregando) {
    return (
      <View style={estilos.central}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen
        options={{
          title: restaurante?.nome ?? 'Cardápio',
          headerRight: () =>
            quantidadeTotal > 0 ? (
              <TouchableOpacity
                style={estilos.botaoCarrinho}
                activeOpacity={0.7}
                onPress={() => router.push('/carrinho')}
              >
                <Text style={estilos.botaoCarrinhoTexto}>Carrinho ({quantidadeTotal})</Text>
              </TouchableOpacity>
            ) : undefined,
        }}
      />
      <FlatList
        contentContainerStyle={estilos.conteudo}
        data={produtos}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProdutoCard produto={item} />}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor="#DC2626" />
        }
        ListHeaderComponent={
          erro ? (
            <Text style={estilos.erro}>{erro}</Text>
          ) : restaurante?.descricao ? (
            <Text style={estilos.descricao}>{restaurante.descricao}</Text>
          ) : null
        }
        ListEmptyComponent={
          erro ? null : <Text style={estilos.vazio}>Nenhum produto disponível.</Text>
        }
        style={estilos.lista}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F9FAFB' },
  lista: { flex: 1 },
  conteudo: { padding: 16 },
  central: { alignItems: 'center', backgroundColor: '#F9FAFB', flex: 1, justifyContent: 'center', padding: 24 },
  erro: { color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  vazio: { color: '#6B7280', fontSize: 14, marginTop: 24, textAlign: 'center' },
  descricao: { color: '#6B7280', fontSize: 14, marginBottom: 12 },
  botaoCarrinho: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  botaoCarrinhoTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
