import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

const UploaderScreen = () => {
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload photos and videos!'
      );
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setSelectedMedia(prev => [...prev, ...result.assets]);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take photos!'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled) {
      setSelectedMedia(prev => [...prev, ...result.assets]);
    }
  };

  // Remove selected media
  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Upload media to server
  const uploadMedia = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media Selected', 'Please select at least one photo or video to upload.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      selectedMedia.forEach((asset, index) => {
        formData.append(`media_${index}`, {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `media_${index}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
        } as any);
      });

      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Media uploaded successfully!');
        setSelectedMedia([]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'There was an error uploading your media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Clear all selected media
  const clearAll = () => {
    setSelectedMedia([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Uploader</Text>
        <Text style={styles.subtitle}>Upload photos and videos from your device</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>📁 Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>📷 Take Photo/Video</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Media Preview */}
      {selectedMedia.length > 0 && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>
              Selected Media ({selectedMedia.length})
            </Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((asset, index) => (
              <View key={index} style={styles.mediaItem}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMedia(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
                
                {asset.type?.includes('video') ? (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>🎥 Video</Text>
                    <Text style={styles.fileName}>{asset.fileName || 'video.mp4'}</Text>
                  </View>
                ) : (
                  <Image source={{ uri: asset.uri }} style={styles.previewImage} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Upload Button */}
      {selectedMedia.length > 0 && (
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={uploadMedia}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>
              Upload {selectedMedia.length} item{selectedMedia.length > 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to use:</Text>
        <Text style={styles.instructionsText}>
          • Tap "Choose from Gallery" to select photos/videos from your device
        </Text>
        <Text style={styles.instructionsText}>
          • Tap "Take Photo/Video" to capture new media with your camera
        </Text>
        <Text style={styles.instructionsText}>
          • You can select multiple items at once
        </Text>
        <Text style={styles.instructionsText}>
          • Tap the × button to remove individual items
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaItem: {
    marginRight: 15,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  videoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#E5E5E7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 20,
    marginBottom: 5,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default UploaderScreen;