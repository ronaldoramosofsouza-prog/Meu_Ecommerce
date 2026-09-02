import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { aprovarRestaurante, listarAdminComMensagem } from '../../src/api/restaurantes';
import StatusBadge from '../../src/components/StatusBadge';
import { Restaurante } from '../../src/types';

export default function AprovarRestaurantes() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await listarAdminComMensagem();
      if (res.ok) setRestaurantes(res.data);
      else Alert.alert('Atenção', res.mensagem);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os restaurantes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const decidir = async (r: Restaurante, status: 'APROVADO' | 'REJEITADO') => {
    try {
      await aprovarRestaurante(r.id, status);
      carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o restaurante.');
    }
  };

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <Text style={estilos.titulo}>Restaurantes cadastrados</Text>
      {restaurantes.length === 0 ? (
        <Text style={estilos.vazio}>Nenhum restaurante cadastrado.</Text>
      ) : (
        restaurantes.map((r) => (
          <View key={r.id} style={estilos.cartao}>
            <View style={estilos.linhaTitulo}>
              <Text style={estilos.nome}>{r.nome}</Text>
              <StatusBadge status={r.status ?? ''} />
            </View>
            {r.categoria ? <Text style={estilos.info}>{r.categoria}</Text> : null}
            {r.endereco ? <Text style={estilos.info}>{r.endereco}</Text> : null}
            <View style={estilos.acoes}>
              {r.status !== 'APROVADO' ? (
                <TouchableOpacity
                  style={estilos.botaoAprovar}
                  activeOpacity={0.7}
                  onPress={() => decidir(r, 'APROVADO')}
                >
                  <Text style={estilos.botaoTexto}>Aprovar</Text>
                </TouchableOpacity>
              ) : null}
              {r.status !== 'REJEITADO' ? (
                <TouchableOpacity
                  style={estilos.botaoRejeitar}
                  activeOpacity={0.7}
                  onPress={() => decidir(r, 'REJEITADO')}
                >
                  <Text style={estilos.botaoRejeitarTexto}>Rejeitar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  conteudo: { padding: 16, paddingBottom: 32 },
  titulo: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  vazio: { color: '#6B7280', fontSize: 15, marginTop: 32, textAlign: 'center' },
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
  linhaTitulo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  nome: { color: '#111827', flex: 1, fontSize: 16, fontWeight: '700', marginRight: 8 },
  info: { color: '#374151', fontSize: 13, marginTop: 4 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoAprovar: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
  },
  botaoRejeitar: {
    borderColor: '#DC2626',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  botaoRejeitarTexto: { color: '#DC2626', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  botaoTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
