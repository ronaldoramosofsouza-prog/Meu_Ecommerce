import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { atualizarStatusComMensagem, listarPedidos } from '../../src/api/pedidos';
import { meuPerfilComMensagem } from '../../src/api/restaurantes';
import StatusBadge from '../../src/components/StatusBadge';
import { conectarSocket, entrarSalaPedido, onPedidoNovo, onStatusAlterado } from '../../src/socket';
import { FORMATA_PRECO, LABEL_STATUS, Pedido, Restaurante } from '../../src/types';

const AVANCO: Record<string, string> = {
  PENDENTE: 'CONFIRMADO',
  CONFIRMADO: 'EM_PREPARO',
  EM_PREPARO: 'PRONTO',
};

export default function Dashboard() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Restaurante | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async (puxarParaAtualizar = false) => {
    if (puxarParaAtualizar) setAtualizando(true);
    try {
      const perfilRes = await meuPerfilComMensagem();
      const meuPerfil = perfilRes.ok ? perfilRes.data : null;
      setPerfil(meuPerfil);
      const lista = await listarPedidos();
      setPedidos(meuPerfil ? lista.filter((p) => p.restaurante_id === meuPerfil.id) : lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os pedidos.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    carregar();
    conectarSocket().catch(() => {});
    const removerNovo = onPedidoNovo((novoPedido) => {
      if (!ativo || !perfil) return;
      if (novoPedido.restaurante_id !== perfil.id) return;
      setPedidos((antigos) =>
        antigos.some((p) => p.id === novoPedido.id) ? antigos : [novoPedido, ...antigos]
      );
      entrarSalaPedido(novoPedido.id);
    });
    const removerStatus = onStatusAlterado(() => {
      if (ativo) carregar();
    });
    return () => {
      ativo = false;
      removerNovo();
      removerStatus();
    };
  }, [perfil, carregar]);

  const avancar = async (pedido: Pedido) => {
    const proximo = AVANCO[pedido.status];
    if (!proximo) return;
    const res = await atualizarStatusComMensagem(pedido.id, proximo);
    if (res.ok) {
      carregar();
    } else {
      Alert.alert('Erro', res.mensagem);
    }
  };

  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (!perfil) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.tituloVazio}>Você ainda não tem um perfil de restaurante</Text>
        <Text style={estilos.textoVazio}>Crie seu perfil para receber pedidos e gerenciar o cardápio.</Text>
        <TouchableOpacity style={estilos.botao} onPress={() => router.push('/perfil')}>
          <Text style={estilos.botaoTexto}>Criar perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen options={{ title: 'Dashboard' }} />
      {perfil.status && perfil.status !== 'APROVADO' ? (
        <View style={estilos.avisoPerfil}>
          <Text style={estilos.avisoPerfilTexto}>
            {perfil.status === 'REJEITADO'
              ? 'Seu perfil foi rejeitado. Verifique os dados em "Meu perfil".'
              : 'Seu perfil está em análise pelo administrador.'}
          </Text>
        </View>
      ) : null}
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} />}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <TouchableOpacity style={estilos.link} onPress={() => router.push('/cardapio')}>
              <Text style={estilos.linkTexto}>Cardápio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.link} onPress={() => router.push('/perfil')}>
              <Text style={estilos.linkTexto}>Meu perfil</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vazio}>
            <Text style={estilos.textoVazio}>Nenhum pedido por enquanto.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={estilos.cartao}>
            <View style={estilos.linhaTopo}>
              <Text style={estilos.nomeCliente}>{item.cliente_nome ?? 'Cliente'}</Text>
              <StatusBadge status={item.status} />
            </View>
            {item.endereco_entrega ? (
              <Text style={estilos.detalhe}>Entrega: {item.endereco_entrega}</Text>
            ) : null}
            <Text style={estilos.detalhe}>
              Itens: {item.itens ? item.itens.reduce((soma, i) => soma + i.quantidade, 0) : 0}
            </Text>
            {item.criado_em ? (
              <Text style={estilos.detalhe}>Criado em {new Date(item.criado_em).toLocaleString('pt-BR')}</Text>
            ) : null}
            <Text style={estilos.total}>{FORMATA_PRECO(item.valor_total)}</Text>
            {AVANCO[item.status] ? (
              <TouchableOpacity style={estilos.botao} onPress={() => avancar(item)}>
                <Text style={estilos.botaoTexto}>Avançar para {LABEL_STATUS[AVANCO[item.status]]}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  centro: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  tituloVazio: { color: '#111827', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  textoVazio: { color: '#6B7280', fontSize: 14, marginTop: 8, textAlign: 'center' },
  botao: { backgroundColor: '#DC2626', borderRadius: 8, marginTop: 16, paddingHorizontal: 18, paddingVertical: 10 },
  botaoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  avisoPerfil: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avisoPerfilTexto: { color: '#92400E', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  lista: { padding: 16, paddingBottom: 32 },
  cabecalho: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  link: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  linkTexto: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
  vazio: { alignItems: 'center', paddingVertical: 40 },
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
  linhaTopo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  nomeCliente: { color: '#111827', flex: 1, fontSize: 15, fontWeight: '700', marginRight: 8 },
  detalhe: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  total: { color: '#DC2626', fontSize: 16, fontWeight: '700', marginTop: 6 },
});
