import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';

interface ImageDisplayProps {
  imageUrl?: string;
  onLoad?: () => void;
  onError?: () => void;
  onRetry?: () => void;
  loading?: boolean;
  error?: boolean;
  retryCount?: number;
}

const { width } = Dimensions.get('window');

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  onLoad,
  onError,
  onRetry,
  loading = false,
  error = false,
  retryCount = 0
}) => {
  const [imageState, setImageState] = useState({
    loading: loading,
    error: error,
    retryCount: retryCount
  });
  const [lowQualityImage, setLowQualityImage] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when imageUrl changes
    if (imageUrl) {
      setImageState({
        loading: true,
        error: false,
        retryCount: 0
      });
      setLowQualityImage(null);
    }
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageState(prev => ({ ...prev, loading: false, error: false }));
    onLoad?.();
  };

  const handleImageError = () => {
    setImageState(prev => ({ ...prev, loading: false, error: true }));
    onError?.();
  };

  const handleRetry = () => {
    setImageState(prev => ({
      loading: true,
      error: false,
      retryCount: prev.retryCount + 1
    }));
    onRetry?.();
  };

  if (!imageUrl) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>No image available</Text>
      </View>
    );
  }

  return (
    <View style={styles.imageContainer}>
      {/* Low-quality placeholder */}
      {lowQualityImage && imageState.loading && (
        <Image
          source={{ uri: lowQualityImage }}
          style={[styles.image, styles.lowQualityImage]}
          blurRadius={2}
        />
      )}
      
      {/* Main image */}
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, imageState.loading && styles.loadingImage]}
        onLoad={handleImageLoad}
        onError={handleImageError}
        fadeDuration={300}
      />
      
      {/* Loading indicator */}
      {imageState.loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6b46c1" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}
      
      {/* Error state */}
      {imageState.error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Failed to load image</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          {imageState.retryCount > 2 && (
            <Text style={styles.errorDetail}>
              Still having issues? The image service might be temporarily unavailable.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    position: 'relative',
  },
  image: {
    width: width - 64,
    height: (width - 64) * 0.75,
    backgroundColor: '#404040',
  },
  lowQualityImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingImage: {
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#f3f4f6',
    fontSize: 14,
    marginTop: 8,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    width: width - 64,
    height: (width - 64) * 0.75,
    backgroundColor: '#404040',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});