// index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Map from '@/components/Map';
import { useDatabase } from '@/contexts/DatabaseContext';
import { initDatabase } from '@/database/schema';

const myInitialPoint = {
  latitude: 58.0267,
  longitude: 56.306,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const getMyStart = () => myInitialPoint;

export default function Index() {
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { isLoading: dbLoading } = useDatabase();

  useEffect(() => {
    const initDB = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
      }
    };

    initDB();
  }, []);

  const handleMapError = useCallback((error: string) => {
    setMapError(error);
    Alert.alert('Ошибка карты', error);
  }, []);

  const handleMapReady = useCallback(() => {
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mapLoaded && !mapError) {
        setMapError('Не удалось загрузить карту. Проверьте подключение к интернету.');
      }
    }, 5000);
    return () => clearTimeout(timeoutId);
  }, [mapLoaded, mapError, handleMapError]);

  useEffect(() => {
    if (mapError) {
      const subscription = setTimeout(() => setMapError(null), 5000);
      return () => clearTimeout(subscription);
    }
  }, [mapError]);

  if (dbLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        initialRegion={getMyStart()}
        onMapReady={handleMapReady}
        onMapError={handleMapError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});