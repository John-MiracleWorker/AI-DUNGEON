import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av'; // Import expo-av
import { Buffer } from 'buffer';
import { useAppSelector, useAppDispatch } from '../../utils/hooks';
import { updateAudioSettings } from '../../store/settingsSlice';
import { useGenerateSpeechMutation } from '../../services/gameApi';

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface AudioPlayerProps {
  sessionId: string;
  narrationText: string;
  onPlaybackComplete?: () => void;
  onError?: (error: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  sessionId,
  narrationText,
  onPlaybackComplete,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const { selectedVoice, playbackSpeed, isAudioEnabled } = useAppSelector(
    (state) => state.settings
  );

  const [generateSpeech, { isLoading: isGenerating }] = useGenerateSpeechMutation();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Replace audioRef with soundRef for expo-av Sound objects
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch audio when component mounts or when dependencies change
  useEffect(() => {
    if (isAudioEnabled && narrationText) {
      fetchAudio();
    }
    
    return () => {
      cleanupAudio();
    };
  }, [sessionId, narrationText, selectedVoice, playbackSpeed, isAudioEnabled]);

  const fetchAudio = async () => {
    if (!isAudioEnabled || !narrationText) return;
    
    setError(null);
    
    try {
      const blob = await generateSpeech({
        sessionId,
        body: {
          text: narrationText,
          voice: selectedVoice,
          speed: playbackSpeed,
          quality: 'standard',
        }
      }).unwrap();

      const arrayBuffer = await blob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      const audioUri = `data:audio/mpeg;base64,${base64Audio}`;

      // Clean up previous audio
      cleanupAudio();

      // Create new sound object using expo-av
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      soundRef.current = sound;
      
      // Get duration from sound status
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }
      
      // Set up event listeners
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
            if (onPlaybackComplete) onPlaybackComplete();
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
          }
        }
      });
      
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch audio';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const cleanupAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (err) {
        console.warn('Error unloading sound:', err);
      }
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const togglePlayback = async () => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        
        // Update progress
        progressIntervalRef.current = setInterval(async () => {
          if (soundRef.current) {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
              setCurrentTime(status.positionMillis / 1000);
            }
          }
        }, 100);
      }
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      const errorMsg = err.message || 'Playback failed';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(value * 1000);
        setCurrentTime(value);
      } catch (err) {
        console.warn('Error seeking audio:', err);
      }
    }
  };

  const handleVoiceChange = (voice: string) => {
    dispatch(updateAudioSettings({ selectedVoice: voice }));
  };

  const handleSpeedChange = (speed: number) => {
    dispatch(updateAudioSettings({ playbackSpeed: speed }));
  };

  if (!isAudioEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audio Narration</Text>
        <TouchableOpacity 
          onPress={() => dispatch(updateAudioSettings({ isAudioEnabled: false }))}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAudio} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.controls}>
            <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
              {isGenerating ? (
                <ActivityIndicator size="small" color="#6b46c1" />
              ) : (
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="#ffffff" 
                />
              )}
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.slider}
                value={currentTime}
                minimumValue={0}
                maximumValue={duration || 100}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#6b46c1"
                maximumTrackTintColor="#404040"
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          <View style={styles.settings}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Voice:</Text>
              <TouchableOpacity 
                style={styles.voiceButton}
                onPress={() => {
                  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
                  const currentIndex = voices.indexOf(selectedVoice);
                  const nextVoice = voices[(currentIndex + 1) % voices.length];
                  handleVoiceChange(nextVoice);
                }}
              >
                <Text style={styles.voiceText}>
                  {selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1)}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Speed:</Text>
              <Slider
                style={styles.speedSlider}
                value={playbackSpeed}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.25}
                onSlidingComplete={handleSpeedChange}
                minimumTrackTintColor="#6b46c1"
                maximumTrackTintColor="#404040"
              />
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#6b46c1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeText: {
    color: '#9ca3af',
    fontSize: 12,
    minWidth: 36,
    textAlign: 'center',
  },
  settings: {
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    color: '#d1d5db',
    fontSize: 14,
    width: 50,
  },
  voiceButton: {
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  voiceText: {
    color: '#f3f4f6',
    fontSize: 14,
  },
  speedSlider: {
    flex: 1,
    marginHorizontal: 8,
  },
  speedText: {
    color: '#d1d5db',
    fontSize: 14,
    width: 40,
    textAlign: 'right',
  },
});

export default AudioPlayer;