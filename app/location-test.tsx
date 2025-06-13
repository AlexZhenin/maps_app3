// app/location-test.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Button, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { notificationManager } from '@/services/notifications';
import { checkProximityToMarkers } from '@/services/location';
import { Marker } from '@/types';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Тестовые маркеры
const TEST_MARKERS: Marker[] = [
  {
    id: 1,
    latitude: 58.01,
    longitude: 56.11,
    description: 'Тестовая метка 1',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    latitude: 58.02,
    longitude: 56.12,
    description: 'Тестовая метка 2',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    latitude: 58.03,
    longitude: 56.13,
    description: 'Тестовая метка 3',
    created_at: new Date().toISOString(),
  },
];

// Регистрация фоновой задачи
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  return new Promise<void>((resolve) => {
  if (error) {
    console.error('Ошибка фоновой задачи:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const lastLocation = locations[locations.length - 1];
    console.log('Фоновое обновление:', lastLocation);
  }
  });
});

export default function LocationTestScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<Location.LocationAccuracy>(Location.LocationAccuracy.Balanced);
  const [testMode, setTestMode] = useState(false);
  const [testLocation, setTestLocation] = useState({
    latitude: 58.0,
    longitude: 56.1,
  });
  const [notifications, setNotifications] = useState<string[]>([]);

  // Инициализация уведомлений
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      setNotifications(prev => [
        `Уведомление: ${notification.request.content.title}`,
        ...prev.slice(0, 9),
      ]);
    });
    return () => subscription.remove();
  }, []);

  // Запрос разрешений
  const requestPermissions = async () => {
    const [locationStatus, notificationStatus] = await Promise.all([
      Location.requestForegroundPermissionsAsync(),
      Notifications.requestPermissionsAsync(),
    ]);

    if (locationStatus.status !== 'granted') {
      setErrorMsg('Доступ к местоположению не разрешён');
    }

    if (notificationStatus.status !== 'granted') {
      setErrorMsg('Доступ к уведомлениям не разрешён');
    }
  };

  // Запуск/остановка отслеживания
  const toggleTracking = async () => {
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      setIsTracking(false);
    } else {
      try {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy,
          timeInterval: 5000,
          distanceInterval: 10,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'Отслеживание местоположения',
            notificationBody: 'Активно',
          },
        });
        setIsTracking(true);
      } catch (error) {
        setErrorMsg('Ошибка при отслеживании местоположения');
        console.error(error);
      }
    }
  };

  // Обработчик обновления местоположения
  const handleLocationUpdate = (newLocation: Location.LocationObject) => {
    setLocation(newLocation);
    
    // Проверка близости к тестовым маркерам
    const nearbyMarkers = checkProximityToMarkers(newLocation, TEST_MARKERS);
    nearbyMarkers.forEach(marker => {
      notificationManager.showNotification(marker);
    });
  };

  // Симуляция движения
  const simulateMovement = () => {
    let counter = 0;
    const interval = setInterval(() => {
      if (counter >= 10) {
        clearInterval(interval);
        return;
      }

      const newLocation = {
        ...testLocation,
        latitude: testLocation.latitude + 0.001,
        longitude: testLocation.longitude + 0.001,
      };
      setTestLocation(newLocation);
      
      handleLocationUpdate({
        coords: {
          ...newLocation,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as Location.LocationObject);

      counter++;
    }, 2000);
  };

  // Тестирование разных сценариев
  const testScenario = (scenario: string) => {
    switch (scenario) {
      case 'no-gps':
        setErrorMsg('Службы геолокации отключены');
        break;
      case 'multiple-markers':
        setTestLocation({ latitude: 58.015, longitude: 56.115 });
        break;
      case 'background':
        setBackgroundTracking(!backgroundTracking);
        break;
      case 'high-accuracy':
        setAccuracy(Location.LocationAccuracy.High);
        break;
      case 'low-accuracy':
        setAccuracy(Location.LocationAccuracy.Low);
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Тестирование местоположения</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Текущее местоположение</Text>
        {location ? (
          <>
            <Text>Широта: {location.coords.latitude.toFixed(6)}</Text>
            <Text>Долгота: {location.coords.longitude.toFixed(6)}</Text>
            <Text>Точность: {location.coords.accuracy} м</Text>
          </>
        ) : (
          <Text>Местоположение не определено</Text>
        )}
        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Управление отслеживанием</Text>
        <View style={styles.switchRow}>
          <Text>Отслеживание: {isTracking ? 'Вкл' : 'Выкл'}</Text>
          <Switch value={isTracking} onValueChange={toggleTracking} />
        </View>
        <View style={styles.switchRow}>
          <Text>Фоновый режим: {backgroundTracking ? 'Вкл' : 'Выкл'}</Text>
          <Switch 
            value={backgroundTracking} 
            onValueChange={() => testScenario('background')} 
          />
        </View>
        <View style={styles.switchRow}>
          <Text>Тестовый режим: {testMode ? 'Вкл' : 'Выкл'}</Text>
          <Switch 
            value={testMode} 
            onValueChange={() => setTestMode(!testMode)} 
          />
        </View>
      </View>

      {testMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тестирование</Text>
          <Button 
            title="Запросить разрешения" 
            onPress={requestPermissions} 
          />
          <Button 
            title="Симулировать движение" 
            onPress={simulateMovement} 
          />
          <Button 
            title="Тест: отключен GPS" 
            onPress={() => testScenario('no-gps')} 
          />
          <Button 
            title="Тест: несколько меток" 
            onPress={() => testScenario('multiple-markers')} 
          />
          <Button 
            title="Высокая точность" 
            onPress={() => testScenario('high-accuracy')} 
          />
          <Button 
            title="Низкая точность" 
            onPress={() => testScenario('low-accuracy')} 
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Тестовые маркеры</Text>
        {TEST_MARKERS.map(marker => (
          <Text key={marker.id}>
            {marker.description}: {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>
        <Button 
          title="Тест уведомления" 
          onPress={() => notificationManager.showNotification(TEST_MARKERS[0])} 
        />
        <Button 
          title="Очистить уведомления" 
          onPress={() => setNotifications([])} 
          color="red"
        />
        {notifications.map((note, index) => (
          <Text key={index} style={styles.notification}>{note}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginTop: 8,
  },
  notification: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});