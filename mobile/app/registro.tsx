import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { criarPerfilRestaurante } from '../src/api/restaurantes';
import { destinoPorRole } from '../src/config/rotas';
import { useAuth } from '../src/context/AuthContext';
import { Role } from '../src/types';

const PAPEIS: { valor: Role; rotulo: string }[] = [
  { valor: 'CLIENTE', rotulo: 'Cliente' },
  { valor: 'ENTREGADOR', rotulo: 'Entregador' },
  { valor: 'RESTAURANTE', rotulo: 'Restaurante' },
];

export default function TelaRegistro() {
  const router = useRouter();
  const { registro } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<Role>('CLIENTE');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoRegistrar() {
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    setEnviando(true);
    setErro(null);
    const res = await registro({ nome: nome.trim(), email: email.trim(), senha, role: papel });
    if (res.ok && res.usuario) {
      if (papel === 'RESTAURANTE') {
        try {
          await criarPerfilRestaurante({ nome: nome.trim() });
        } catch {
          // Perfil pode ser completado depois na aba "Meu restaurante".
        }
      }
      router.replace(destinoPorRole(papel));
    } else {
      setEnviando(false);
      setErro(res.mensagem ?? 'Não foi possível criar a conta.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={estilos.tela}
    >
      <View style={estilos.conteudo}>
        <Text style={estilos.titulo}>Criar conta</Text>

        <TextInput
          style={estilos.campo}
          placeholder="Nome"
          placeholderTextColor="#9CA3AF"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={estilos.campo}
          placeholder="E-mail"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={estilos.campo}
          placeholder="Senha"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <Text style={estilos.rotulo}>Você é?</Text>
        <View style={estilos.linhaPapeis}>
          {PAPEIS.map((p) => {
            const selecionado = papel === p.valor;
            return (
              <TouchableOpacity
                key={p.valor}
                style={[estilos.papel, selecionado && estilos.papelSelecionado]}
                activeOpacity={0.7}
                onPress={() => setPapel(p.valor)}
              >
                <Text style={[estilos.papelTexto, selecionado && estilos.papelTextoSelecionado]}>
                  {p.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

        <TouchableOpacity
          style={estilos.botao}
          activeOpacity={0.7}
          onPress={aoRegistrar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.botaoTexto}>Cadastrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F9FAFB' },
  conteudo: { flex: 1, justifyContent: 'center', padding: 24 },
  titulo: { color: '#111827', fontSize: 26, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
  campo: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rotulo: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  linhaPapeis: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  papel: {
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  papelSelecionado: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  papelTexto: { color: '#374151', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  papelTextoSelecionado: { color: '#FFFFFF' },
  erro: { color: '#DC2626', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  botao: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 14,
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
