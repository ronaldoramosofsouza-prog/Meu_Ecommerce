import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { enviarPosicaoGps, onGpsCliente, conectarSocket } from '../socket';

interface Props {
  pedidoId: string;
  modo: 'entregador' | 'cliente';
}

interface Coords {
  latitude: number;
  longitude: number;
}

const COORDS_PADRAO: Coords = { latitude: -23.5505, longitude: -46.6333 };

// react-native-maps não roda no navegador (depende de SDKs nativos de mapa),
// então a versão web mostra a posição em texto + link para abrir no Google Maps.
export default function MapaRastreamento({ pedidoId, modo }: Props) {
  const [coords, setCoords] = useState<Coords>(COORDS_PADRAO);
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
            return;
          }
          const atual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!ativo) return;
          const { latitude, longitude } = atual.coords;
          setCoords({ latitude, longitude });
          enviarPosicaoGps(pedidoId, latitude, longitude);
          setCarregando(false);

          assinaturaWatch.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
            ({ coords: novasCoords }) => {
              if (!ativo) return;
              setCoords({ latitude: novasCoords.latitude, longitude: novasCoords.longitude });
              enviarPosicaoGps(pedidoId, novasCoords.latitude, novasCoords.longitude);
            }
          );
        } catch {
          if (ativo) setCarregando(false);
        }
      })();
    } else {
      removerOuvinte = onGpsCliente((payload) => {
        if (!ativo) return;
        if (payload.pedidoId !== pedidoId) return;
        setCoords({ latitude: payload.lat, longitude: payload.lng });
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

  const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;

  return (
    <View style={estilos.wrapper}>
      <Text style={estilos.titulo}>📍 Rastreamento</Text>
      <Text style={estilos.aviso}>Mapa interativo disponível apenas no app mobile.</Text>
      {carregando ? (
        <Text style={estilos.texto}>
          {modo === 'entregador' ? 'Obtendo localização...' : 'Aguardando localização do entregador...'}
        </Text>
      ) : (
        <>
          <Text style={estilos.texto}>
            Lat: {coords.latitude.toFixed(5)} · Lng: {coords.longitude.toFixed(5)}
          </Text>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
            Abrir no Google Maps
          </a>
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  wrapper: {
    width: '100%',
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    padding: 16,
    justifyContent: 'center',
    gap: 6,
  },
  titulo: { fontSize: 15, fontWeight: '700', color: '#111827' },
  aviso: { fontSize: 12, color: '#6B7280' },
  texto: { fontSize: 13, color: '#374151' },
});
