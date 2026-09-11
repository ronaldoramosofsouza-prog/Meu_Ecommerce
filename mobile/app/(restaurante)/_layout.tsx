import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import BotaoSair from '../../src/components/BotaoSair';
import { destinoPorRole } from '../../src/config/rotas';
import { useAuth } from '../../src/context/AuthContext';

export default function LayoutRestaurante() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.carregando}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.role !== 'RESTAURANTE') return <Redirect href={destinoPorRole(usuario.role)} />;

  return (
    <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center', headerRight: () => <BotaoSair /> }}>
      <Stack.Screen name="dashboard" options={{ title: 'Pedidos' }} />
      <Stack.Screen name="cardapio" options={{ title: 'Cardápio' }} />
      <Stack.Screen name="perfil" options={{ title: 'Meu restaurante' }} />
    </Stack>
  );
}

const estilos = StyleSheet.create({
  carregando: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
