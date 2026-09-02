import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { criarPedidoComMensagem } from '../../src/api/pedidos';
import { useCarrinho } from '../../src/context/CarrinhoContext';
import { FORMATA_PRECO } from '../../src/types';

const METODOS = [
  { valor: 'PIX', rotulo: 'Pix' },
  { valor: 'CARTAO', rotulo: 'Cartão' },
  { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
];

export default function TelaCheckout() {
  const router = useRouter();
  const { itens, total, limparCarrinho } = useCarrinho();
  const [endereco, setEndereco] = useState('');
  const [metodo, setMetodo] = useState('PIX');
  const [enviando, setEnviando] = useState(false);

  async function finalizar() {
    if (!endereco.trim()) {
      Alert.alert('Endereço obrigatório', 'Informe o endereço de entrega.');
      return;
    }
    if (itens.length === 0) return;
    setEnviando(true);
    const res = await criarPedidoComMensagem({
      itens: itens.map((i) => ({
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_unitario: Number(i.produto.preco || 0),
      })),
      metodo_pagamento: metodo,
      endereco_entrega: endereco.trim(),
    });
    setEnviando(false);
    if (res.ok) {
      limparCarrinho();
      router.replace({ pathname: '/pedido/[id]', params: { id: res.data.id } });
    } else {
      Alert.alert('Erro', res.mensagem ?? 'Não foi possível criar o pedido.');
    }
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.rotulo}>Endereço de entrega</Text>
      <TextInput
        style={estilos.campo}
        placeholder="Rua, número, bairro, complemento"
        placeholderTextColor="#9CA3AF"
        value={endereco}
        onChangeText={setEndereco}
        multiline
      />

      <Text style={estilos.rotulo}>Forma de pagamento</Text>
      <View style={estilos.linhaMetodos}>
        {METODOS.map((m) => {
          const selecionado = metodo === m.valor;
          return (
            <TouchableOpacity
              key={m.valor}
              style={[estilos.metodo, selecionado && estilos.metodoSelecionado]}
              activeOpacity={0.7}
              onPress={() => setMetodo(m.valor)}
            >
              <Text style={[estilos.metodoTexto, selecionado && estilos.metodoTextoSelecionado]}>
                {m.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={estilos.resumo}>
        <Text style={estilos.linhaResumo}>
          Itens: {itens.reduce((soma, i) => soma + i.quantidade, 0)}
        </Text>
        <Text style={estilos.total}>Total: {FORMATA_PRECO(total)}</Text>
      </View>

      <TouchableOpacity
        style={[estilos.botao, enviando && estilos.botaoInativo]}
        activeOpacity={0.7}
        onPress={finalizar}
        disabled={enviando}
      >
        {enviando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={estilos.botaoTexto}>Confirmar pedido</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F9FAFB' },
  conteudo: { padding: 16 },
  rotulo: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  campo: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    marginBottom: 16,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  linhaMetodos: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metodo: {
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  metodoSelecionado: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  metodoTexto: { color: '#374151', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  metodoTextoSelecionado: { color: '#FFFFFF' },
  resumo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  linhaResumo: { color: '#6B7280', fontSize: 14, marginBottom: 6 },
  total: { color: '#111827', fontSize: 18, fontWeight: '800' },
  botao: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 14,
  },
  botaoInativo: { opacity: 0.6 },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
