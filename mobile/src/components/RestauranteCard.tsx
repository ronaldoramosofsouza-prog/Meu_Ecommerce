import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Restaurante } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  restaurante: Restaurante;
}

export default function RestauranteCard({ restaurante }: Props) {
  const router = useRouter();
  const temImagem = !!restaurante.imagem_url;

  return (
    <TouchableOpacity
      style={estilos.cartao}
      activeOpacity={0.7}
      onPress={() => router.push(`/restaurante/${restaurante.id}`)}
    >
      {temImagem ? (
        <Image
          source={{ uri: restaurante.imagem_url! }}
          style={estilos.imagem}
          resizeMode="cover"
        />
      ) : (
        <View style={estilos.semImagem}>
          <Text style={estilos.inicial}>{restaurante.nome?.charAt(0) ?? 'R'}</Text>
        </View>
      )}
      <View style={estilos.info}>
        <View style={estilos.linhaTitulo}>
          <Text style={estilos.nome} numberOfLines={1}>{restaurante.nome}</Text>
          {restaurante.status && restaurante.status !== 'APROVADO' ? (
            <StatusBadge status={restaurante.status} />
          ) : null}
        </View>
        {restaurante.categoria ? (
          <Text style={estilos.categoria}>{restaurante.categoria}</Text>
        ) : null}
        {restaurante.endereco ? (
          <Text style={estilos.endereco} numberOfLines={1}>{restaurante.endereco}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  imagem: {
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  semImagem: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  inicial: {
    color: '#9CA3AF',
    fontSize: 28,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  linhaTitulo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nome: {
    color: '#111827',
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  categoria: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  endereco: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
});
