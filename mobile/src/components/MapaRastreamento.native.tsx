import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { enviarPosicaoGps, onGpsCliente, conectarSocket } from '../socket';

interface Props {
  pedidoId: string;
  modo: 'entregador' | 'cliente';
}

const REGIAO_PADRAO: Region = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function MapaRastreamento({ pedidoId, modo }: Props) {
  const [regiao, setRegiao] = useState<Region>(REGIAO_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const assinaturaWatch = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let ativo = true;
    let removerOuvinte: (() => void) | null = null;

    conectarSocket().catch(() => {});

    if (modo === 'entregador') {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (!ativo) return;
          if (status !== 'granted') {
            setCarregando(false);
            Alert.alert('Permissão de localização', 'O app precisa da sua localização para enviar a posição ao cliente.');
            return;
          }
          const atual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!ativo) return;
          const { latitude, longitude } = atual.coords;
          setRegiao({ ...REGIAO_PADRAO, latitude, longitude });
          enviarPosicaoGps(pedidoId, latitude, longitude);
          setCarregando(false);

          assinaturaWatch.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
            ({ coords }) => {
              if (!ativo) return;
              setRegiao((antiga) => ({ ...antiga, latitude: coords.latitude, longitude: coords.longitude }));
              enviarPosicaoGps(pedidoId, coords.latitude, coords.longitude);
            }
          );
        } catch {
          if (ativo) {
            setCarregando(false);
            Alert.alert('Erro de localização', 'Não foi possível obter sua localização.');
          }
        }
      })();
    } else {
      removerOuvinte = onGpsCliente((payload) => {
        if (!ativo) return;
        if (payload.pedidoId !== pedidoId) return;
        setRegiao((antiga) => ({ ...antiga, latitude: payload.lat, longitude: payload.lng }));
        setCarregando(false);
      });
    }

    return () => {
      ativo = false;
      removerOuvinte?.();
      assinaturaWatch.current?.remove();
      assinaturaWatch.current = null;
    };
  }, [pedidoId, modo]);

  return (
    <View style={estilos.wrapper}>
      <MapView
        style={estilos.mapa}
        region={regiao}
        showsUserLocation={modo === 'entregador'}
      >
        <Marker coordinate={{ latitude: regiao.latitude, longitude: regiao.longitude }} />
      </MapView>
      {carregando ? (
        <View style={estilos.aviso}>
          <Text style={estilos.avisoTexto}>
            {modo === 'entregador' ? 'Obtendo localização...' : 'Aguardando localização do entregador...'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  wrapper: { width: '100%', height: 300, borderRadius: 12, overflow: 'hidden' },
  mapa: { flex: 1 },
  aviso: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  avisoTexto: { color: '#FFFFFF', fontSize: 13, textAlign: 'center' },
});
