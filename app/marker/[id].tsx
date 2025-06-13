// [id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, 
  Alert, TextInput, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ImageList from '@/components/ImageList';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Marker, MarkerImage } from '@/types';

export default function MarkerDetails() {
  const { id } = useLocalSearchParams();
  const { getMarkers, getMarkerById, deleteMarker, addImage, 
    deleteImage, getMarkerImages, refreshMarkers, updateMarker } = useDatabase();
  const [marker, setMarker] = useState<Marker | null>(null);
  const [images, setImages] = useState<MarkerImage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  //const [images, setImages] = useState<string[]>(marker?.images || []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const markerData = await getMarkerById(Number(id));
      const imagesData = await getMarkerImages(Number(id));
      
      if (markerData) {
        setMarker(markerData);
        setEditedDescription(markerData.description || '');
      }
      setImages(imagesData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные маркера');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    
    if (id) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [id, loadData]);

  const handleSaveDescription = async () => {
    if (!marker) return;
    
    try {
      setIsLoading(true);
      await updateMarker(marker.id, editedDescription);
      setMarker(prev => prev ? { ...prev, description: editedDescription } : null);
      setIsEditing(false);
      Alert.alert('Успех', 'Описание успешно обновлено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить описание');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImageAsync = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        await addImage(Number(id), result.assets[0].uri);
        setImages([...images, { 
          id: Date.now(), 
          marker_id: Number(id), 
          uri: result.assets[0].uri,
          created_at: new Date().toISOString() 
        }]);

      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение.');
    }
    finally {
      setIsLoading(false);
    }
  };

  const removeImage = async (imageId: number) => {
    try {
      setIsLoading(true);
      await deleteImage(imageId);
      setImages(images.filter((img) => img.id !== imageId));
    } catch {
      Alert.alert('Ошибка', 'Не удалось удалить изображение');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMarker = async () => {
    try {
      setIsLoading(true);
      await deleteMarker(Number(id));
      refreshMarkers();
      Alert.alert('Успех', 'Маркер успешно удален');
      router.back();
    } catch {
      Alert.alert('Ошибка', "Не удалось удалить маркер");
    } finally {
      setIsLoading(false);
    }
  };

  if (!marker) {
    return <Text style={styles.errorText}>Маркер не найден</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ID Маркера: {id}</Text>
      <Text style={styles.title}>Координаты:</Text>
      <Text style={styles.text}>Широта: {marker.latitude}</Text>
      <Text style={styles.text}>Долгота: {marker.longitude}</Text>
      <Text style={styles.text}>Дата создания: {marker.created_at}</Text>
      
      <View>
        <Text style={styles.title}>Описание:</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={editedDescription}
              onChangeText={setEditedDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveDescription}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Сохранить</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.text}>{marker.description || 'Нет описания'}</Text>
            <TouchableOpacity 
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Редактировать</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      
      
      <View style={styles.buttonContainer}>
        <Button title="Добавить изображение" onPress={pickImageAsync} />
      </View>
      
      <ImageList images={images} onRemoveImage={removeImage} />

      <View style={styles.buttonContainer}>
        <Button title="Удалить маркер" onPress={handleDeleteMarker} color="red" />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 20,
  },
  buttonContainer: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});