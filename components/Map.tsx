import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker as MapMarker, LongPressEvent, Circle } from 'react-native-maps';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useRouter } from 'expo-router';
import { Marker } from '@/types';
import { requestLocationPermissions, startLocationUpdates, 
  calculateDistance, PROXIMITY_THRESHOLD } from '@/services/location';
import { NotificationManager } from '@/services/notifications';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';


type MapProps = {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMapReady?: () => void;
  onMapError?: (error: string) => void;
};

const myInitialPoint = {
  latitude: 58,
  longitude: 56.1,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const getMyStart = () => myInitialPoint;

export default function Map({
  initialRegion = getMyStart(),
  onMapReady,
  onMapError,
}: MapProps) {
  const { addMarker, getMarkers, deleteMarker, markersUpdated, isLoading: dbLoading } = useDatabase();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const markersRef = useRef<Marker[]>(markers);
  const router = useRouter();
  const isMounted = useRef(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationManager = useRef(new NotificationManager());
  const currentLocationRef = useRef<Location.LocationObject | null>(null);
  
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  const loadMarkers = useCallback(async () => {
    try {
      setIsLoading(true);
      const updatedMarkers = await getMarkers();
      if (isMounted.current) {
        setMarkers(updatedMarkers);
        markersRef.current = updatedMarkers;
      }
    } catch (error) {
      const errorMsg = 'Не удалось загрузить маркеры';
      console.error(errorMsg, error);
      onMapError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [getMarkers, onMapError]);

  const handleLongPress = useCallback(async (e: LongPressEvent) => {
    if (simulationMode) return;

    const { latitude, longitude } = e.nativeEvent.coordinate;
    try {
      await addMarker(latitude, longitude);
      await loadMarkers();
    } catch (error) {
      const errorMsg = 'Не удалось добавить маркер';
      console.error(errorMsg, error);
      onMapError?.(errorMsg);
    }
  }, [addMarker, loadMarkers, onMapError]);

  const focusOnCurrentLocation = useCallback(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert('Ошибка', 'Текущее местоположение недоступно');
    }
  }, [currentLocation]);

  const toggleSimulation = useCallback(async () => {
    // Сохраняем реальное местоположение перед симуляцией
    const realLocation = currentLocationRef.current;
    
    // Если currentLocation отсутствует, запрашиваем его
    let location = realLocation;
    if (!location) {
      try {
        const newLocation = await Location.getCurrentPositionAsync({});
        setCurrentLocation(newLocation);
        location = newLocation;
      } catch (error) {
        Alert.alert("Ошибка", "Не удалось получить текущее местоположение");
        return;
      }
    }

    setSimulationMode(prev => {
      const newMode = !prev;
      if (newMode) {
        console.log('Симуляция запущена');
        startSimulation(location!);

      } else {
        console.log('Симуляция завершена');

        stopSimulation();
        if (realLocation) {
          setCurrentLocation(realLocation);
        }
      }
      return newMode;
    });
  }, []);

  const startSimulation = useCallback((startLocation: Location.LocationObject) => {
    // Очищаем предыдущий интервал
    stopSimulation();

    // Начальные координаты
    let simulatedLocation = {
      ...startLocation,
      coords: {
        ...startLocation.coords,
        // Добавляем небольшой случайный сдвиг для начальной точки
        latitude: startLocation.coords.latitude + (Math.random() * 0.001 - 0.0005),
        longitude: startLocation.coords.longitude + (Math.random() * 0.001 - 0.0005),
      }
    };

    // Направление движения (в градусах)
    let direction = Math.random() * 2 * Math.PI; // Случайное начальное направление
    const speed = 0.0001; // Скорость движения (в градусах за шаг)

    simulationIntervalRef.current = setInterval(() => {
      setCurrentLocation(prev => {
        if (!prev) return prev;

        // Изменяем направление с небольшой случайной вариацией
        direction += (Math.random() * 0.2 - 0.1);

        // Рассчитываем новые координаты
        const newLatitude = simulatedLocation.coords.latitude + Math.sin(direction) * speed;
        const newLongitude = simulatedLocation.coords.longitude + Math.cos(direction) * speed;

        // Обновляем simulatedLocation
        simulatedLocation = {
          ...simulatedLocation,
          coords: {
            ...simulatedLocation.coords,
            latitude: newLatitude,
            longitude: newLongitude,
            accuracy: 5, // Добавляем точность для реалистичности
            heading: direction * (180 / Math.PI), // Направление в градусах
            speed: 0.5, // Скорость в м/с
          },
          timestamp: Date.now(),
        };

        // Проверяем маркеры в зоне для новых координат
        const nearbyMarkers = markersRef.current.filter(marker => {
          const distance = calculateDistance(
            newLatitude,
            newLongitude,
            marker.latitude,
            marker.longitude
          );
          return distance <= PROXIMITY_THRESHOLD;
        });

        if (nearbyMarkers.length > 0) {
          notificationManager.current.handleMarkersInZone(nearbyMarkers);
        } else {
          notificationManager.current.clearNotification();
        }

        return simulatedLocation;
      });
      
    }, 1000); // Обновляем позицию каждую секунду
  }, []);

  const stopSimulation = useCallback(async () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    const newLocation = await Location.getCurrentPositionAsync({});
    setCurrentLocation(newLocation);
  }, []);

  // Запрос разрешений и инициализация
  useEffect(() => {
    const initialize = async () => {
      try {
        // Запрашиваем разрешения на локацию
        await requestLocationPermissions();
        
        // Запрашиваем разрешения на уведомления
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Не удалось получить разрешение на уведомления');
        }
        
        // Настраиваем обработчик уведомлений
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        
        // Получаем текущую позицию
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
        
        // Загружаем маркеры
        await loadMarkers();
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    loadMarkers();
  }, [markersUpdated, loadMarkers]);

  // Отслеживание местоположения и проверка маркеров
  useEffect(() => {
  let locationSubscription: Location.LocationSubscription | null = null;
  let isActive = true;

  const startWatching = async () => {
    try {
      locationSubscription = await startLocationUpdates((location) => {
        if (!isActive) return;
        
        setCurrentLocation(location);
        
        const nearbyMarkers = markersRef.current.filter(marker => {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            marker.latitude,
            marker.longitude
          );
          return distance <= PROXIMITY_THRESHOLD;
        });

        if (nearbyMarkers.length > 0) {
          notificationManager.current.handleMarkersInZone(nearbyMarkers);
        } else {
          notificationManager.current.clearNotification();
        }
      });
    } catch (error) {
      console.error("Ошибка отслеживания местоположения:", error);
    }
  };

  startWatching();

  return () => {
    isActive = false;
    if (locationSubscription) {
      locationSubscription.remove();
    }
    notificationManager.current.clearNotification();
  };
}, []);

// Очищаем интервал при размонтировании
  useEffect(() => {
    return () => {
      stopSimulation();
    };
  }, [stopSimulation]);
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onLongPress={handleLongPress}
        onMapReady={onMapReady}
        showsUserLocation={false} // рисуем свою точку
      >
        {currentLocation && (
          <>
            <MapMarker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
              }}
              title="Ваше местоположение"
              pinColor="blue"
            />
            <Circle
              center={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
              }}
              radius={PROXIMITY_THRESHOLD}
              strokeWidth={1}
              strokeColor="rgba(0, 122, 255, 0.5)"
              fillColor="rgba(0, 122, 255, 0.2)"
            />
          </>
        )}
        
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.description || `Метка #${marker.id}`}
            onPress={() => router.push(`/marker/${marker.id}`)}
          />
        ))}
      </MapView>
      <TouchableOpacity 
        style={styles.focusButton}
        onPress={focusOnCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.simulationButton, simulationMode && styles.simulationButtonActive]}
        onPress={toggleSimulation}
      >
        <Ionicons name="walk" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  focusButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  simulationButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  simulationButtonActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
  },
});