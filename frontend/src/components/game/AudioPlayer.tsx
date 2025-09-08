import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Slider,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppSelector, useAppDispatch } from '../../utils/hooks';
import { updateAudioSettings } from '../../store/settingsSlice';
import { useGenerateSpeechMutation } from '../../services/gameApi';

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
      const response = await generateSpeech({
        sessionId,
        body: {
          text: narrationText,
          voice: selectedVoice,
          speed: playbackSpeed,
          quality: 'standard',
        }
      }).unwrap();
      
      const audioUrl = URL.createObjectURL(response);
      
      // Clean up previous audio
      cleanupAudio();
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (onPlaybackComplete) onPlaybackComplete();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
      
      audio.onerror = (e) => {
        const errorMsg = 'Failed to load audio';
        setError(errorMsg);
        if (onError) onError(errorMsg);
      };
      
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch audio';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        
        // Update progress
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
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

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVoiceChange = (voice: string) => {
    dispatch(updateAudioSettings({ selectedVoice: voice }));
  };

  const handleSpeedChange = (speed: number) => {
    dispatch(updateAudioSettings({ playbackSpeed: speed }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
                thumbStyle={styles.thumb}
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
                thumbStyle={styles.thumb}
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
  thumb: {
    backgroundColor: '#6b46c1',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default AudioPlayer;