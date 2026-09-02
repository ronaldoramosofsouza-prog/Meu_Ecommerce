import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listarRestaurantesComMensagem } from '../../src/api/restaurantes';
import RestauranteCard from '../../src/components/RestauranteCard';
import { Restaurante } from '../../src/types';

export default function TelaHome() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const res = await listarRestaurantesComMensagem();
    if (res.ok) {
      setRestaurantes(res.data);
      setErro(null);
    } else {
      setErro(res.mensagem ?? 'Não foi possível carregar os restaurantes.');
    }
  }, []);

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

  if (erro && restaurantes.length === 0) {
    return (
      <View style={estilos.central}>
        <Text style={estilos.erro}>{erro}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={estilos.lista}
      contentContainerStyle={estilos.conteudo}
      data={restaurantes}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <RestauranteCard restaurante={item} />}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor="#DC2626" />
      }
      ListEmptyComponent={
        <Text style={estilos.vazio}>Nenhum restaurante disponível ainda.</Text>
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: { flex: 1, backgroundColor: '#F9FAFB' },
  conteudo: { flexGrow: 1, padding: 16 },
  central: { alignItems: 'center', backgroundColor: '#F9FAFB', flex: 1, justifyContent: 'center', padding: 24 },
  erro: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  vazio: { color: '#6B7280', fontSize: 14, marginTop: 24, textAlign: 'center' },
});
