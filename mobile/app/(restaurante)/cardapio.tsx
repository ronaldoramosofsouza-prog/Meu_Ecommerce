import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { alterarDisponibilidade, criarProdutoComMensagem, deletarProduto, listarProdutosComMensagem } from '../../src/api/produtos';
import { meuPerfilComMensagem } from '../../src/api/restaurantes';
import { FORMATA_PRECO, Produto } from '../../src/types';

export default function Cardapio() {
  const router = useRouter();
  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estoque, setEstoque] = useState('');

  const carregar = useCallback(async () => {
    try {
      if (!restauranteId) {
        const res = await meuPerfilComMensagem();
        if (!res.ok || !res.data) {
          setCarregando(false);
          return;
        }
        setRestauranteId(res.data.id);
        const lista = await listarProdutosComMensagem(res.data.id);
        if (lista.ok) setProdutos(lista.data);
        setCarregando(false);
        return;
      }
      const lista = await listarProdutosComMensagem(restauranteId);
      if (lista.ok) setProdutos(lista.data);
    } catch {
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, [restauranteId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirModal = () => {
    setNome('');
    setDescricao('');
    setPreco('');
    setCategoria('');
    setEstoque('');
    setModalAberto(true);
  };

  const salvar = async () => {
    const precoNumero = Number(preco.replace(',', '.'));
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do produto.');
      return;
    }
    if (!precoNumero || precoNumero <= 0) {
      Alert.alert('Atenção', 'Informe um preço válido.');
      return;
    }
    if (!restauranteId) {
      Alert.alert('Atenção', 'Perfil do restaurante não encontrado.');
      return;
    }
    setSalvando(true);
    const res = await criarProdutoComMensagem({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      preco: precoNumero,
      categoria: categoria.trim() || undefined,
      estoque: Number(estoque) || 0,
      restaurante_id: restauranteId,
    });
    setSalvando(false);
    if (res.ok) {
      setModalAberto(false);
      carregar();
    } else {
      Alert.alert('Erro', res.mensagem);
    }
  };

  const alternarDisponibilidade = async (produto: Produto) => {
    try {
      await alterarDisponibilidade(produto.id, !produto.disponivel);
      carregar();
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o produto.');
    }
  };

  const remover = (produto: Produto) => {
    Alert.alert('Remover produto', `Deseja remover "${produto.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletarProduto(produto.id);
            carregar();
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o produto.');
          }
        },
      },
    ]);
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
      <TouchableOpacity style={estilos.botaoNovo} activeOpacity={0.8} onPress={abrirModal}>
        <Text style={estilos.botaoNovoTexto}>Novo produto</Text>
      </TouchableOpacity>

      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <View style={estilos.vazio}>
            <Text style={estilos.vazioTexto}>Nenhum produto cadastrado ainda.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={estilos.cartao}>
            <View style={estilos.info}>
              <Text style={estilos.nome}>{item.nome}</Text>
              {item.categoria ? <Text style={estilos.categoria}>{item.categoria}</Text> : null}
              {item.descricao ? <Text style={estilos.descricao} numberOfLines={2}>{item.descricao}</Text> : null}
              <Text style={estilos.preco}>{FORMATA_PRECO(item.preco)}</Text>
              <Text style={estilos.statusItem}>
                {item.disponivel === false ? 'Indisponível' : 'Disponível'}
              </Text>
            </View>
            <View style={estilos.acoes}>
              <TouchableOpacity
                style={[estilos.botaoPequeno, item.disponivel === false ? estilos.botaoAtivar : estilos.botaoDesativar]}
                activeOpacity={0.7}
                onPress={() => alternarDisponibilidade(item)}
              >
                <Text style={estilos.botaoPequenoTexto}>
                  {item.disponivel === false ? 'Ativar' : 'Desativar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botaoPequeno, estilos.botaoRemover]}
                activeOpacity={0.7}
                onPress={() => remover(item)}
              >
                <Text style={estilos.botaoPequenoTexto}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalAberto} animationType="slide" transparent>
        <View style={estilos.fundoModal}>
          <View style={estilos.etapaModal}>
            <Text style={estilos.tituloModal}>Novo produto</Text>
            <TextInput
              style={estilos.input}
              placeholder="Nome *"
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={estilos.input}
              placeholder="Descrição"
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />
            <TextInput
              style={estilos.input}
              placeholder="Preço * (ex: 25,90)"
              keyboardType="decimal-pad"
              value={preco}
              onChangeText={setPreco}
            />
            <TextInput
              style={estilos.input}
              placeholder="Categoria"
              value={categoria}
              onChangeText={setCategoria}
            />
            <TextInput
              style={estilos.input}
              placeholder="Estoque"
              keyboardType="number-pad"
              value={estoque}
              onChangeText={setEstoque}
            />
            <View style={estilos.linhaBotoes}>
              <TouchableOpacity
                style={[estilos.botao, estilos.botaoCancelar]}
                activeOpacity={0.7}
                onPress={() => setModalAberto(false)}
              >
                <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botao]}
                activeOpacity={0.7}
                disabled={salvando}
                onPress={salvar}
              >
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={estilos.botaoTexto}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  centro: { alignItems: 'center', backgroundColor: '#F9FAFB', flex: 1, justifyContent: 'center' },
  botaoNovo: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoNovoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  lista: { padding: 16 },
  vazio: { alignItems: 'center', paddingVertical: 40 },
  vazioTexto: { color: '#6B7280', fontSize: 14 },
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
  info: { flex: 1 },
  nome: { color: '#111827', fontSize: 15, fontWeight: '600' },
  categoria: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  descricao: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  preco: { color: '#DC2626', fontSize: 15, fontWeight: '700', marginTop: 6 },
  statusItem: { color: '#059669', fontSize: 12, fontWeight: '700', marginTop: 4 },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botaoPequeno: { borderRadius: 8, flex: 1, paddingVertical: 8, alignItems: 'center' },
  botaoAtivar: { backgroundColor: '#059669' },
  botaoDesativar: { backgroundColor: '#D97706' },
  botaoRemover: { backgroundColor: '#DC2626' },
  botaoPequenoTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  fundoModal: {
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  etapaModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  tituloModal: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    color: '#111827',
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linhaBotoes: { flexDirection: 'row', gap: 12, marginTop: 8 },
  botao: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoCancelar: { backgroundColor: '#F3F4F6' },
  botaoCancelarTexto: { color: '#374151', fontSize: 15, fontWeight: '700' },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
