import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { destinoPorRole } from '../../src/config/rotas';
import { useAuth } from '../../src/context/AuthContext';

export default function LayoutAdmin() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.carregando}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.role !== 'ADMIN') return <Redirect href={destinoPorRole(usuario.role)} />;

  return (
    <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="kanban" options={{ title: 'Pedidos' }} />
      <Stack.Screen name="aprovar-restaurantes" options={{ title: 'Aprovar restaurantes' }} />
    </Stack>
  );
}

const estilos = StyleSheet.create({
  carregando: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
