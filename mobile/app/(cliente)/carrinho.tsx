import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useCarrinho } from '../../src/context/CarrinhoContext';
import { FORMATA_PRECO } from '../../src/types';
import type { ItemCarrinho } from '../../src/context/CarrinhoContext';

export default function TelaCarrinho() {
  const router = useRouter();
  const { itens, total, alterarQuantidade, removerItem } = useCarrinho();

  function renderizarItem({ item }: { item: ItemCarrinho }) {
    return (
      <View style={estilos.item}>
        <View style={estilos.itemInfo}>
          <Text style={estilos.itemNome}>{item.produto.nome}</Text>
          <Text style={estilos.itemPreco}>{FORMATA_PRECO(item.produto.preco)}</Text>
        </View>
        <View style={estilos.controles}>
          <TouchableOpacity
            style={estilos.botaoControle}
            onPress={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
          >
            <Text style={estilos.botaoControleTexto}>-</Text>
          </TouchableOpacity>
          <Text style={estilos.quantidade}>{item.quantidade}</Text>
          <TouchableOpacity
            style={estilos.botaoControle}
            onPress={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
          >
            <Text style={estilos.botaoControleTexto}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.botaoRemover}
            onPress={() => removerItem(item.produto.id)}
          >
            <Text style={estilos.botaoRemoverTexto}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (itens.length === 0) {
    return (
      <View style={estilos.central}>
        <Text style={estilos.vazio}>Seu carrinho está vazio.</Text>
        <TouchableOpacity
          style={estilos.botao}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Text style={estilos.botaoTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.tela}>
      <FlatList
        contentContainerStyle={estilos.conteudo}
        data={itens}
        keyExtractor={(i) => i.produto.id}
        renderItem={renderizarItem}
      />
      <View style={estilos.rodape}>
        <Text style={estilos.total}>Total: {FORMATA_PRECO(total)}</Text>
        <TouchableOpacity
          style={estilos.botao}
          activeOpacity={0.7}
          onPress={() => router.push('/checkout')}
        >
          <Text style={estilos.botaoTexto}>Finalizar pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F9FAFB' },
  conteudo: { padding: 16 },
  central: { alignItems: 'center', backgroundColor: '#F9FAFB', flex: 1, justifyContent: 'center', padding: 24 },
  vazio: { color: '#6B7280', fontSize: 15, marginBottom: 20, textAlign: 'center' },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
  },
  itemInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  itemNome: { color: '#111827', flex: 1, fontSize: 15, fontWeight: '600', marginRight: 12 },
  itemPreco: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  controles: { alignItems: 'center', flexDirection: 'row', marginTop: 10 },
  botaoControle: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  botaoControleTexto: { color: '#111827', fontSize: 16, fontWeight: '700' },
  quantidade: { color: '#111827', fontSize: 15, fontWeight: '700', marginHorizontal: 12, minWidth: 20, textAlign: 'center' },
  botaoRemover: { marginLeft: 'auto' },
  botaoRemoverTexto: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  rodape: {
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  total: { color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  botao: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 14,
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
