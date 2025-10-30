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

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const UploaderScreen = () => {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need media library permission to choose a video.'
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera permission to record a video.'
      );
      return false;
    }
    return true;
  };

  // Pick a single video from gallery
  const pickVideo = async () => {
    const hasPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (hasPermission.status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedVideo(result.assets[0]);
      setUploadedUrl(null);
    }
  };

  // Record a single video using camera
  const recordVideo = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      allowsEditing: false,
      videoMaxDuration: 300, // optional
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setSelectedVideo(asset);
      setUploadedUrl(null);
    }
  };

  const clearSelection = () => {
    setSelectedVideo(null);
    setUploadedUrl(null);
  };

  // Upload selected video directly to Cloudinary (unsigned)
  const uploadVideo = async () => {
    if (!selectedVideo) {
      Alert.alert('No Video Selected', 'Please choose or record a video first.');
      return;
    }
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      Alert.alert('Missing Config', 'Please set your Cloudinary cloud name and upload preset.');
      return;
    }

    setUploading(true);
    try {
      const asset = selectedVideo;

      let uri = asset.uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();

      const maxBytes = 50 * 1024 * 1024; // 50MB example
      const part = blob.size > maxBytes ? blob.slice(0, maxBytes, blob.type) : blob;

      const mime = asset.mimeType || 'video/mp4';
      const ext = mime.split('/')[1] || 'mp4';
      const name = asset.fileName || `video.${ext}`;

      const formData = new FormData();
      formData.append('file', part as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData, 
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Cloudinary upload failed (${res.status}): ${errText}`);
      }

      const json = await res.json();
      setUploadedUrl(json.secure_url);
      Alert.alert('Success', 'Video uploaded to Cloudinary.');
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Uploader</Text>
        <Text style={styles.subtitle}>Upload one video to Cloudinary</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={pickVideo}>
          <Text style={styles.buttonText}>📁 Choose Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={recordVideo}>
          <Text style={styles.buttonText}>🎥 Record Video</Text>
        </TouchableOpacity>
      </View>

      {selectedVideo && (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Selected Video</Text>
            <TouchableOpacity onPress={clearSelection}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>🎞️</Text>
            <Text style={styles.fileName}>
              {selectedVideo.fileName || 'video.mp4'}
            </Text>
            <Text style={styles.fileMeta}>
              {Math.round((selectedVideo.fileSize || 0) / (1024 * 1024))} MB
            </Text>
          </View>
        </View>
      )}

      {selectedVideo && (
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={uploadVideo}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload Video</Text>
          )}
        </TouchableOpacity>
      )}

      {uploadedUrl && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Uploaded URL</Text>
          <Text style={styles.resultUrl} numberOfLines={2}>
            {uploadedUrl}
          </Text>
        </View>
      )}

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Notes</Text>
        <Text style={styles.instructionsText}>
          • This screen uploads one video at a time to Cloudinary.
        </Text>
        <Text style={styles.instructionsText}>
          • Configure `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` above.
        </Text>
        <Text style={styles.instructionsText}>
          • Uses unsigned upload; consider signed uploads for production.
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
  buttonRow: {
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
  previewCard: {
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
  videoPlaceholder: {
    height: 120,
    backgroundColor: '#E5E5E7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 28,
    marginBottom: 8,
  } as any,
  fileName: {
    fontSize: 14,
    color: '#333',
  },
  fileMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultUrl: {
    fontSize: 12,
    color: '#007AFF',
  },
  instructionsCard: {
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