import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';

const API_BASE_URL = 'http://localhost:3000';

interface MediaItem {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  created_at: string;
}

const MediaLibrary = () => {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/media`);
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }
      const data = await response.json();
      setMedia(data.resources || []);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      Alert.alert('Error', 'Failed to load your media. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedia();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your media...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Media Library</Text>
        <Text style={styles.subtitle}>
          {media.length} {media.length === 1 ? 'item' : 'items'} uploaded
        </Text>
      </View>

      {media.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📹</Text>
          <Text style={styles.emptyText}>No media uploaded yet</Text>
          <Text style={styles.emptySubtext}>
            Upload videos using the uploader screen
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => router.push('/uploader')}
          >
            <Text style={styles.uploadButtonText}>Go to Uploader</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mediaGrid}>
          {media
            .filter((item) => item.resource_type === 'video')
            .map((item) => (
              <View key={item.public_id} style={styles.mediaCard}>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedVideo(
                      selectedVideo === item.secure_url ? null : item.secure_url
                    )
                  }
                >
                  <View style={styles.videoThumbnail}>
                    <Text style={styles.playIcon}>▶️</Text>
                    <Text style={styles.videoLabel}>Video</Text>
                  </View>
                </TouchableOpacity>

                {selectedVideo === item.secure_url && (
                  <Video
                    source={{ uri: item.secure_url }}
                    style={styles.videoPlayer}
                    useNativeControls
                    resizeMode="contain"
                  />
                )}

                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaName} numberOfLines={1}>
                    {item.public_id.split('/').pop() || 'video'}
                  </Text>
                  <Text style={styles.mediaMeta}>
                    {formatFileSize(item.bytes)}
                    {item.duration && ` • ${formatDuration(item.duration)}`}
                  </Text>
                  <Text style={styles.mediaDate}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() =>
                    Alert.alert('Video URL', item.secure_url, [
                      { text: 'Copy URL', onPress: () => {} },
                      { text: 'Close', style: 'cancel' },
                    ])
                  }
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaGrid: {
    gap: 20,
  },
  mediaCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoThumbnail: {
    height: 200,
    backgroundColor: '#E5E5E7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  playIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  videoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 10,
  },
  mediaInfo: {
    marginBottom: 15,
  },
  mediaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  mediaMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  mediaDate: {
    fontSize: 12,
    color: '#999',
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MediaLibrary;