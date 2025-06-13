// ImageList.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MarkerImage } from '@/types';

interface ImageListProps {
  images: MarkerImage[];
  onRemoveImage: (id: number) => void;
}

export default function ImageList({ images, onRemoveImage }: ImageListProps) {
  if (!images || images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет изображений</Text>
      </View>
    );
  }
  
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {images.map((image) => (
        <View key={image.id} style={styles.imageContainer}>
          <Image 
            source={{ uri: image.uri }} 
            style={styles.image}
            onError={() => console.warn('Не удалось загрузить изображение')} />
          <TouchableOpacity 
            onPress={() => onRemoveImage(image.id)} 
            style={styles.removeButton}>
            <Text style={styles.removeText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    marginTop: 8,
  },
  removeText: {
    color: 'red',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

//export default memo(ImageList);