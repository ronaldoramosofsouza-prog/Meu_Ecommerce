import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { destinoPorRole } from '../src/config/rotas';
import { useAuth } from '../src/context/AuthContext';

export default function TelaInicio() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.carregando}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  if (!usuario) return <Redirect href="/login" />;

  return <Redirect href={destinoPorRole(usuario.role)} />;
}

const estilos = StyleSheet.create({
  carregando: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
