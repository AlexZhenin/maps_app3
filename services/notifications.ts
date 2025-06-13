// notifications.ts
import * as Notifications from 'expo-notifications';
import { Marker } from '@/types';

export class NotificationManager {
  private activeNotificationId: string | null = null;
  private visitedMarkers: Record<string, number> = {};
  
  // Обновленные логика будет здесь
  public handleMarkersInZone(markers: Marker[]): void {
    const now = Date.now();
    const newMarkers: Marker[] = [];

    // Проверяем каждый маркер
    markers.forEach(marker => {
      const lastVisited = this.visitedMarkers[marker.id];
      
      // Если маркер новый или не посещался более 1 минуты
      if (!lastVisited || (now - lastVisited > 60000)) {
        newMarkers.push(marker);
        this.visitedMarkers[marker.id] = now;
      }
    });

    // Показываем уведомление только если есть новые маркеры
    if (newMarkers.length > 0) {
      this.showNotification(newMarkers);
    }
  }

  private async showNotification(markers: Marker[]): Promise<void> {
    // Отменяем предыдущее уведомление
    if (this.activeNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(this.activeNotificationId);
    }

    // Формируем текст уведомления
    let notificationBody = 'Вы рядом с сохранёнными точками:';
    markers.forEach(marker => {
      notificationBody += `\n- ${marker.description || `Метка #${marker.id}`}`;
    });

    // Показываем новое уведомление
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Вы рядом с метками!',
        body: notificationBody,
        data: { markerIds: markers.map(m => m.id) },
      },
      trigger: null, // Показать немедленно
    });

    this.activeNotificationId = notificationId;
  }
  async clearNotification(): Promise<void> {
    if (this.activeNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(this.activeNotificationId);
      this.activeNotificationId = null;
    }
  }
}