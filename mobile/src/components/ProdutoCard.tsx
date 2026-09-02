import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCarrinho } from '../context/CarrinhoContext';
import { FORMATA_PRECO, Produto } from '../types';

interface Props {
  produto: Produto;
}

export default function ProdutoCard({ produto }: Props) {
  const { adicionarItem } = useCarrinho();
  const indisponivel = produto.disponivel === false;

  return (
    <View style={estilos.cartao}>
      <View style={estilos.info}>
        <Text style={estilos.nome}>{produto.nome}</Text>
        {produto.descricao ? (
          <Text style={estilos.descricao} numberOfLines={2}>{produto.descricao}</Text>
        ) : null}
        <Text style={estilos.preco}>{FORMATA_PRECO(produto.preco)}</Text>
      </View>
      <TouchableOpacity
        style={[estilos.botao, indisponivel && estilos.botaoInativo]}
        activeOpacity={0.7}
        disabled={indisponivel}
        onPress={() => adicionarItem(produto)}
      >
        <Text style={estilos.botaoTexto}>{indisponivel ? 'Indisponível' : 'Adicionar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nome: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  descricao: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  preco: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  botao: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  botaoInativo: {
    backgroundColor: '#D1D5DB',
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
