import { Link, useRouter } from 'expo-router';
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

import { destinoPorRole } from '../src/config/rotas';
import { useAuth } from '../src/context/AuthContext';

export default function TelaLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    const res = await login(email.trim(), senha);
    setEnviando(false);
    if (res.ok && res.usuario) {
      router.replace(destinoPorRole(res.usuario.role));
    } else {
      setErro(res.mensagem ?? 'Não foi possível entrar.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={estilos.tela}
    >
      <View style={estilos.cartao}>
        <Text style={estilos.titulo}>FoodExpress</Text>
        <Text style={estilos.subtitulo}>Entre para fazer seu pedido</Text>

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

        {erro ? <Text style={estilos.erro}>{erro}</Text> : null}

        <TouchableOpacity
          style={estilos.botao}
          activeOpacity={0.7}
          onPress={aoEntrar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.botaoTexto}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Link href="/registro" replace={false} style={estilos.link}>
          <Text style={estilos.linkTexto}>Não tem conta? Cadastre-se</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F9FAFB' },
  cartao: { flex: 1, justifyContent: 'center', padding: 24 },
  titulo: { color: '#DC2626', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  subtitulo: { color: '#6B7280', fontSize: 15, marginBottom: 28, marginTop: 8, textAlign: 'center' },
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
  link: { marginTop: 18, textAlign: 'center' },
  linkTexto: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
});
