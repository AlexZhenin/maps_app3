import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';

export const PROXIMITY_THRESHOLD = 100;

export interface LocationConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;  // Как часто обновлять местоположение (мс)
  distanceInterval: number;  // Минимальное расстояние (в метрах) между обновлениями
}

export const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Доступ к местоположению не разрешён');
    }

    // Проверяем, включена ли служба геолокации
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      throw new Error('Служба геолокации отключена');
    }
  } catch (error) {
    throw new Error('Ошибка доступа к геолокации');
  }
};

export const startLocationUpdates = async (
  onLocation: (location: LocationObject) => void
): Promise<Location.LocationSubscription> => {
  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    onLocation
  );
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Радиус Земли в метрах
  const f1 = lat1 * Math.PI/180;
  const f2 = lat2 * Math.PI/180;
  const df = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(df/2) * Math.sin(df/2) +
            Math.cos(f1) * Math.cos(f2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
