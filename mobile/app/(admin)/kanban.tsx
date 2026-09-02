import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { atualizarStatusComMensagem, listarPedidos } from '../../src/api/pedidos';
import StatusBadge from '../../src/components/StatusBadge';
import { conectarSocket, onStatusAlterado } from '../../src/socket';
import { FORMATA_PRECO, LABEL_STATUS, Pedido } from '../../src/types';

const PROXIMO: Record<string, string> = {
  PENDENTE: 'CONFIRMADO',
  CONFIRMADO: 'EM_PREPARO',
  EM_PREPARO: 'PRONTO',
  PRONTO: 'EM_ROTA',
  EM_ROTA: 'ENTREGUE',
};

export default function Kanban() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarPedidos();
      setPedidos(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    conectarSocket().catch(() => {});
    const removerOuvinte = onStatusAlterado(() => {
      if (ativo) carregar();
    });
    carregar();
    return () => {
      ativo = false;
      removerOuvinte();
    };
  }, [carregar]);

  const mudarStatus = async (pedido: Pedido, status: string) => {
    try {
      const res = await atualizarStatusComMensagem(pedido.id, status);
      if (!res.ok) Alert.alert('Atenção', res.mensagem);
      else carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o pedido.');
    }
  };

  const cancelar = (pedido: Pedido) => {
    Alert.alert(
      'Cancelar pedido',
      `Deseja realmente cancelar o pedido de ${pedido.cliente_nome ?? 'cliente'}?`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: () => mudarStatus(pedido, 'CANCELADO') },
      ]
    );
  };

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <Text style={estilos.titulo}>Todos os pedidos</Text>

      {pedidos.length === 0 ? (
        <Text style={estilos.vazio}>Nenhum pedido encontrado.</Text>
      ) : (
        pedidos.map((pedido) => (
          <View key={pedido.id} style={estilos.cartao}>
            <View style={estilos.linhaTitulo}>
              <Text style={estilos.nome}>{pedido.cliente_nome ?? 'Cliente'}</Text>
              <StatusBadge status={pedido.status} />
            </View>
            <Text style={estilos.info}>Restaurante: {pedido.restaurante_nome ?? '—'}</Text>
            {pedido.entregador_nome ? (
              <Text style={estilos.info}>Entregador: {pedido.entregador_nome}</Text>
            ) : null}
            {pedido.endereco_entrega ? (
              <Text style={estilos.info}>Endereço: {pedido.endereco_entrega}</Text>
            ) : null}
            {pedido.criado_em ? (
              <Text style={estilos.info}>Criado em: {formatarData(pedido.criado_em)}</Text>
            ) : null}
            <Text style={estilos.preco}>{FORMATA_PRECO(pedido.valor_total)}</Text>

            <View style={estilos.acoes}>
              {PROXIMO[pedido.status] ? (
                <TouchableOpacity
                  style={estilos.botaoAvancar}
                  activeOpacity={0.7}
                  onPress={() => mudarStatus(pedido, PROXIMO[pedido.status])}
                >
                  <Text style={estilos.botaoTexto}>Avançar para {LABEL_STATUS[PROXIMO[pedido.status]]}</Text>
                </TouchableOpacity>
              ) : null}
              {pedido.status !== 'CANCELADO' && pedido.status !== 'ENTREGUE' ? (
                <TouchableOpacity
                  style={estilos.botaoCancelar}
                  activeOpacity={0.7}
                  onPress={() => cancelar(pedido)}
                >
                  <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={estilos.botaoAprovar}
        activeOpacity={0.7}
        onPress={() => router.push('/aprovar-restaurantes')}
      >
        <Text style={estilos.botaoTexto}>Aprovar restaurantes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function formatarData(valor: string | Date): string {
  const data = new Date(valor);
  if (isNaN(data.getTime())) return String(valor);
  return data.toLocaleString('pt-BR');
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  conteudo: { padding: 16, paddingBottom: 32 },
  titulo: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  vazio: { color: '#6B7280', fontSize: 15, textAlign: 'center', marginTop: 32 },
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
  preco: { color: '#DC2626', fontSize: 16, fontWeight: '700', marginTop: 8 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoAvancar: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  botaoCancelar: {
    borderColor: '#DC2626',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  botaoCancelarTexto: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  botaoTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  botaoAprovar: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 12,
  },
});
