// operations.ts
import db, { initDatabase } from './schema';
import { Marker, MarkerImage } from '@/types';

const ensureDatabaseInitialized = async () => {
  try {
    await initDatabase();
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw new Error('База данных не доступна');
  }
};

// Добавление маркера
export const addMarker = async (
  latitude: number,
  longitude: number,
  description?: string
): Promise<number> => {
  await ensureDatabaseInitialized();
  const db_ = await db;
  try {
    let lastInsertId: number | undefined;
    await db_.withTransactionAsync(async () => {
      const result = await db_.runAsync(
        'INSERT INTO markers (latitude, longitude, description) VALUES (?, ?, ?);',
        [latitude, longitude, description || null]
      );
      lastInsertId = result.lastInsertRowId as number;
    });
    if (lastInsertId === undefined) {
      throw new Error('Ошибка при получении ID добавленного маркера');
    }
    return lastInsertId;
  } catch (error) {
    console.error('Ошибка при добавлении маркера:', error);
    throw error;
  }
};

export const updateMarker = async (
  id: number, 
  description: string
): Promise<void> => {
  if (!id || isNaN(id)) {
    throw new Error('Неверный ID маркера');
  }
  if (typeof description !== 'string') {
    throw new Error('Описание должно быть строкой');
  }

  await ensureDatabaseInitialized();
  const db_ = await db;
  try {
    await db_.withTransactionAsync(async () => {
      // Проверка наличия маркера с таким ID 
      const markerExists = await db_.getFirstAsync<{count: number}>(
        'SELECT COUNT(*) as count FROM markers WHERE id = ?;',
        id
      );

      if (!markerExists || markerExists.count === 0) {
        throw new Error('Маркер не существует');
      }
      
      await db_.runAsync(`UPDATE markers SET description = ? WHERE id = ?`,
        [description, id]
      );
    });
  } catch (error) {
    console.error('Ошибка при обновлении маркера', error);
    throw error;
  }
};

// Удаление маркера
export const deleteMarker = async (id: number): Promise<void> => {
  if (!id || isNaN(id)) {
    throw new Error('Неверный ID маркера');
  }
  
  await ensureDatabaseInitialized();
  const db_ = await db;
  try {
    await db_.withTransactionAsync(async () => {
      // Проверка наличия маркера с таким ID 
      const markerExists = await db_.getFirstAsync<{count: number}>(
        'SELECT COUNT(*) as count FROM markers WHERE id = ?;',
        id
      );

      if (!markerExists || markerExists.count === 0) {
        throw new Error('Маркер не существует');
      }
      
      // Сначала удаляем все изображения маркера
      await db_.runAsync('DELETE FROM marker_images WHERE marker_id = ?;', [id]);
      // Затем удаляем сам маркер
      await db_.runAsync('DELETE FROM markers WHERE id = ?;', [id]);
    });
  } catch (error) {
    console.error('Ошибка при удалении маркера:', error);
    throw error;
  }
};

// Получение всех маркеров
export const getMarkers = async (): Promise<Marker[]> => {
  await ensureDatabaseInitialized();
  const db_ = await db;

  try {
    const result = await db_.getAllAsync<Marker>('SELECT * FROM markers;');
    return result;
  } catch (error) {
    console.error('Ошибка при получении маркеров:', error);
    throw error;
  }
};

// Получение маркера по ID
export const getMarkerById = async (id: number): Promise<Marker | null> => {
  if (!id || isNaN(id)) {
    throw new Error('Неверный ID маркера');
  }
  
  await ensureDatabaseInitialized();
  const db_ = await db;
  try {
    const result = await db_.getFirstAsync<Marker>(
      'SELECT * FROM markers WHERE id = ?;',
      id
    );
    return result || null;
  } catch (error) {
    console.error('Ошибка при получении маркера:', error);
    throw error;
  }
};

// Добавление изображения
export const addImage = async (
  markerId: number,
  uri: string
): Promise<void> => {
  if (!markerId || isNaN(markerId)) {
    throw new Error('Неверный ID маркера');
  }
  if (!uri) {
    throw new Error('URI изображения обязательно');
  }
  
  await ensureDatabaseInitialized();
  const db_ = await db;
  try {
    const markerExists = await db_.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM markers WHERE id = ?;',
      markerId
    );

    if (!markerExists || markerExists.count === 0) {
      throw new Error('Маркер не существует');
    }

    await db_.withTransactionAsync(async () => {
      await db_.runAsync(
        'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
        [markerId, uri]
      );
    });
  } catch (error) {
    console.error('Ошибка при добавлении изображения:', error);
    throw error;
  }
};

// Удаление изображения
export const deleteImage = async (id: number): Promise<void> => {
  await ensureDatabaseInitialized();
  const db_ = await db;
  
  try {
    await db_.withTransactionAsync(async () => {
      await db_.runAsync('DELETE FROM marker_images WHERE id = ?;', [id]);
    });
  } catch (error) {
    console.error('Ошибка при удалении изображения:', error);
    throw error;
  }
};

// Получение изображений для маркера
export const getMarkerImages = async (
  markerId: number
): Promise<MarkerImage[]> => {
  await ensureDatabaseInitialized();
  const db_ = await db;

  try {
    const result = await db_.getAllAsync<MarkerImage>(
      'SELECT * FROM marker_images WHERE marker_id = ?;',
      markerId
    );
    return result;
  } catch (error) {
    console.error('Ошибка при получении изображений:', error);
    throw error;
  }
};