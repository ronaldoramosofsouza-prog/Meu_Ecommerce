import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { atualizarPerfilRestaurante, criarPerfilComMensagem, meuPerfilComMensagem } from '../../src/api/restaurantes';
import StatusBadge from '../../src/components/StatusBadge';
import { Restaurante } from '../../src/types';

export default function PerfilRestaurante() {
  const [perfil, setPerfil] = useState<Restaurante | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [endereco, setEndereco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');

  const carregar = useCallback(async () => {
    try {
      const res = await meuPerfilComMensagem();
      const dados = res.ok && res.data ? res.data : null;
      setPerfil(dados);
      if (dados) {
        setNome(dados.nome || '');
        setDescricao(dados.descricao || '');
        setCategoria(dados.categoria || '');
        setEndereco(dados.endereco || '');
        setImagemUrl(dados.imagem_url || '');
      }
    } catch {
      setPerfil(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do restaurante.');
      return;
    }
    setSalvando(true);
    try {
      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        categoria: categoria.trim() || undefined,
        endereco: endereco.trim() || undefined,
        imagem_url: imagemUrl.trim() || undefined,
      };
      if (perfil) {
        try {
          await atualizarPerfilRestaurante(dados);
        } catch {
          Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
          setSalvando(false);
          return;
        }
      } else {
        const res = await criarPerfilComMensagem(dados);
        if (!res.ok) {
          Alert.alert('Erro', res.mensagem);
          setSalvando(false);
          return;
        }
      }
      Alert.alert('Perfil salvo', 'Esteja atento à aprovação do administrador.');
      setSalvando(false);
      carregar();
    } catch {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <View style={[estilos.tela, estilos.centro]}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.tela} contentContainerStyle={estilos.conteudo}>
      <Text style={estilos.titulo}>Perfil do restaurante</Text>
      {perfil?.status ? (
        <View style={estilos.linhaStatus}>
          <Text style={estilos.rotuloStatus}>Status: </Text>
          <StatusBadge status={perfil.status} />
        </View>
      ) : null}

      <Text style={estilos.rotulo}>Nome *</Text>
      <TextInput
        style={estilos.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Nome do restaurante"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={estilos.rotulo}>Descrição</Text>
      <TextInput
        style={[estilos.input, estilos.inputMultilinha]}
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descrição do restaurante"
        placeholderTextColor="#9CA3AF"
        multiline
      />

      <Text style={estilos.rotulo}>Categoria</Text>
      <TextInput
        style={estilos.input}
        value={categoria}
        onChangeText={setCategoria}
        placeholder="Ex: Pizzaria, Hamburgueria"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={estilos.rotulo}>Endereço</Text>
      <TextInput
        style={estilos.input}
        value={endereco}
        onChangeText={setEndereco}
        placeholder="Endereço do restaurante"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={estilos.rotulo}>URL da imagem</Text>
      <TextInput
        style={estilos.input}
        value={imagemUrl}
        onChangeText={setImagemUrl}
        placeholder="https://..."
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[estilos.botao, salvando && estilos.botaoInativo]}
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
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { backgroundColor: '#F9FAFB', flex: 1 },
  centro: { alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: 16 },
  titulo: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  linhaStatus: { alignItems: 'center', flexDirection: 'row', marginBottom: 16 },
  rotuloStatus: { color: '#6B7280', fontSize: 14 },
  rotulo: { color: '#374151', fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultilinha: { minHeight: 80, textAlignVertical: 'top' },
  botao: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
  },
  botaoInativo: { opacity: 0.7 },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
