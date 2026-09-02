import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { meusPedidos } from '../../../src/api/pedidos';
import MapaRastreamento from '../../../src/components/MapaRastreamento';
import StatusBadge from '../../../src/components/StatusBadge';
import { conectarSocket, entrarSalaPedido, onStatusAlterado } from '../../../src/socket';
import { FORMATA_PRECO, Pedido } from '../../../src/types';

export default function PedidoStatus() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(
    async (puxarParaAtualizar = false) => {
      if (!id) return;
      if (puxarParaAtualizar) setAtualizando(true);
      try {
        const lista = await meusPedidos();
        const encontrado = lista.find((p) => p.id === id);
        if (encontrado) {
          setPedido(encontrado);
          setErro(false);
        } else {
          setErro(true);
        }
      } catch {
        setErro(true);
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [id]
  );

  useEffect(() => {
    let ativo = true;
    carregar();
    conectarSocket().catch(() => {});
    if (id) entrarSalaPedido(id);
    const remover = onStatusAlterado((payload) => {
      if (!ativo) return;
      if ('id' in payload) {
        if (payload.id === id) setPedido(payload);
      } else if (payload.pedidoId === id) {
        carregar();
      }
    });
    return () => {
      ativo = false;
      remover();
    };
  }, [id, carregar]);

  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (erro || !pedido) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.tituloErro}>Pedido não encontrado</Text>
        <TouchableOpacity style={estilos.botao} onPress={() => router.replace('/home')}>
          <Text style={estilos.botaoTexto}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mostraMapa = pedido.status === 'EM_ROTA' || pedido.status === 'ENTREGUE';

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={estilos.conteudo}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} />}
    >
      <Stack.Screen options={{ title: 'Pedido' }} />
      <View style={estilos.cartao}>
        <View style={estilos.linha}>
          <Text style={estilos.rotulo}>Status</Text>
          <StatusBadge status={pedido.status} />
        </View>
        {pedido.criado_em ? (
          <Text style={estilos.detalhe}>Criado em {new Date(pedido.criado_em).toLocaleString('pt-BR')}</Text>
        ) : null}
        {pedido.restaurante_nome ? (
          <Text style={estilos.detalhe}>Restaurante: {pedido.restaurante_nome}</Text>
        ) : null}
        {pedido.entregador_nome ? (
          <Text style={estilos.detalhe}>Entregador: {pedido.entregador_nome}</Text>
        ) : null}
      </View>

      <Text style={estilos.secaoTitulo}>Itens</Text>
      <View style={estilos.cartao}>
        {pedido.itens && pedido.itens.length > 0
          ? pedido.itens.map((item, indice) => (
              <View key={item.id ?? indice} style={estilos.itemLinha}>
                <View style={estilos.itemInfo}>
                  <Text style={estilos.itemNome}>{item.nome ?? 'Item'}</Text>
                  <Text style={estilos.itemDetalhe}>
                    {item.quantidade}x {FORMATA_PRECO(item.preco_unitario)}
                  </Text>
                </View>
                <Text style={estilos.itemTotal}>
                  {FORMATA_PRECO(Number(item.preco_unitario) * item.quantidade)}
                </Text>
              </View>
            ))
          : null}
        <View style={estilos.divisor} />
        <View style={estilos.linha}>
          <Text style={estilos.totalRotulo}>Total</Text>
          <Text style={estilos.totalValor}>{FORMATA_PRECO(pedido.valor_total)}</Text>
        </View>
      </View>

      {pedido.endereco_entrega ? (
        <>
          <Text style={estilos.secaoTitulo}>Entrega</Text>
          <View style={estilos.cartao}>
            <Text style={estilos.endereco}>{pedido.endereco_entrega}</Text>
            {pedido.metodo_pagamento ? (
              <Text style={estilos.detalhe}>Pagamento: {pedido.metodo_pagamento}</Text>
            ) : null}
          </View>
        </>
      ) : null}

      {mostraMapa ? (
        <>
          <Text style={estilos.secaoTitulo}>Rastreamento</Text>
          <MapaRastreamento pedidoId={pedido.id} modo="cliente" />
        </>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  conteudo: { padding: 16, paddingBottom: 32 },
  centro: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  tituloErro: { color: '#111827', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  botao: { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  botaoTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
  linha: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rotulo: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  detalhe: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  secaoTitulo: { color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  itemLinha: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemInfo: { flex: 1, marginRight: 12 },
  itemNome: { color: '#111827', fontSize: 14, fontWeight: '600' },
  itemDetalhe: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  itemTotal: { color: '#111827', fontSize: 14, fontWeight: '600' },
  divisor: { backgroundColor: '#E5E7EB', height: 1, marginBottom: 10, marginTop: 2 },
  totalRotulo: { color: '#111827', fontSize: 15, fontWeight: '700' },
  totalValor: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
  endereco: { color: '#111827', fontSize: 14, lineHeight: 20 },
});
