import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function BotaoSair() {
  const { logout } = useAuth();
  const router = useRouter();

  async function sair() {
    await logout();
    router.replace('/login');
  }

  return (
    <TouchableOpacity onPress={sair} hitSlop={8} style={{ paddingHorizontal: 12 }}>
      <Text style={{ color: '#DC2626', fontSize: 14, fontWeight: '700' }}>Sair</Text>
    </TouchableOpacity>
  );
}
