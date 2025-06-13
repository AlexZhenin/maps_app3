// DatabaseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase } from '@/database/schema';
import { addMarker, deleteMarker, getMarkers, getMarkerById, 
    addImage, deleteImage, getMarkerImages, updateMarker } from '@/database/operations';
import { Marker, MarkerImage, DatabaseContextType, ActiveNotification } from '@/types';

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [markersUpdated, setMarkersUpdated] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshMarkers = () => setMarkersUpdated(prev => prev + 1);
  const [activeNotifications] = useState<Map<number, ActiveNotification>>(
   new Map()
  );

  // Инициализация базы данных
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);


  return (
  <DatabaseContext.Provider
    value={{
      addMarker,
      deleteMarker,
      getMarkers,
      getMarkerById,
      addImage,
      deleteImage,
      getMarkerImages,
      isLoading,
      isInitialized,
      error,
      updateMarker,
      refreshMarkers,
      markersUpdated
    }}
  >
    {children}
  </DatabaseContext.Provider>
);
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase должен использоваться внутри DatabaseProvider');
  }
  return context;
};