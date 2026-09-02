import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../src/context/AuthContext';
import { CarrinhoProvider } from '../src/context/CarrinhoContext';

export default function LayoutRaiz() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" options={{ headerShown: true, title: 'Entrar' }} />
          <Stack.Screen name="registro" options={{ headerShown: true, title: 'Criar conta' }} />
        </Stack>
      </CarrinhoProvider>
    </AuthProvider>
  );
}
