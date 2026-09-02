import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { destinoPorRole } from '../../src/config/rotas';
import { useAuth } from '../../src/context/AuthContext';

export default function LayoutCliente() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.carregando}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.role !== 'CLIENTE') return <Redirect href={destinoPorRole(usuario.role)} />;

  return (
    <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="home" options={{ title: 'Restaurantes' }} />
      <Stack.Screen name="restaurante/[id]" options={{ title: 'Cardápio' }} />
      <Stack.Screen name="carrinho" options={{ title: 'Carrinho' }} />
      <Stack.Screen name="checkout" options={{ title: 'Finalizar pedido' }} />
      <Stack.Screen name="pedido/[id]" options={{ title: 'Acompanhar pedido' }} />
    </Stack>
  );
}

const estilos = StyleSheet.create({
  carregando: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
