// types.ts
import * as Location from 'expo-location';

// Интерфейс для координат маркера
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Интерфейс для маркера
export interface Marker {
  id: number; 
  latitude: number; // Широта
  longitude: number; // Долгота
  description?: string; // Описание
  created_at: string;
}

// Интерфейс для изображения маркера
export interface MarkerImage {
  id: number;
  marker_id: number; // ID маркера, к которому привязано изображение
  uri: string;
  created_at: string;
}

// Интерфейс для контекста базы данных
export interface DatabaseContextType {
  // Операции с маркерами
  addMarker: (latitude: number, longitude: number, description?: string) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  getMarkerById: (id: number) => Promise<Marker | null>;
  updateMarker: (id: number, description: string) => Promise<void>;
  refreshMarkers: () => void;
  markersUpdated: number;

  // Операции с изображениями
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;

  // Статусы
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;

  //activeNotifications: Map<number, ActiveNotification>;
  //notificationManager: NotificationManager;

}

export interface ActiveNotification {
  markerId: number;
  notificationId: string;
  timestamp: number;
}

export interface LocationState {
  location: Location.LocationObject | null;
  error: string | null;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}