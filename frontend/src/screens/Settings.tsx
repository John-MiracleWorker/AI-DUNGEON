import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAppSelector, useAppDispatch } from '../utils/hooks';
import { clearRecentGames } from '../store/launcherSlice';
import { clearAllQueued } from '../store/offlineSlice';
import { updateSetting } from '../store/settingsSlice';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
  onPress,
  showArrow = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
      activeOpacity={0.8}
    >
      <View style={styles.settingContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color="#8b5cf6" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#374151', true: '#8b5cf6' }}
            thumbColor={value ? '#ffffff' : '#9ca3af'}
          />
        )}
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { recentGames } = useAppSelector((state) => state.launcher);
  const { queuedActions } = useAppSelector((state) => state.offline);
  const { contentRating, safetyFilter } = useAppSelector((state) => state.settings);
  
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleHapticToggle = async (value: boolean) => {
    setHapticsEnabled(value);
    if (value) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await AsyncStorage.setItem('@ai_dungeon:haptics_enabled', value.toString());
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('@ai_dungeon:notifications_enabled', value.toString());
  };

  const handleOfflineModeToggle = async (value: boolean) => {
    setOfflineMode(value);
    await AsyncStorage.setItem('@ai_dungeon:offline_mode', value.toString());
  };

  const handleAutoSyncToggle = async (value: boolean) => {
    setAutoSync(value);
    await AsyncStorage.setItem('@ai_dungeon:auto_sync', value.toString());
  };

  const handleContentRatingToggle = () => {
    const newRating = contentRating === 'PG-13' ? 'R' : 'PG-13';
    dispatch(updateSetting({ contentRating: newRating }));
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSafetyFilterToggle = (value: boolean) => {
    dispatch(updateSetting({ safetyFilter: value }));
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const clearRecentGamesData = () => {
    Alert.alert(
      'Clear Recent Games',
      'This will remove all recent games from the launcher. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            dispatch(clearRecentGames());
            AsyncStorage.removeItem('@ai_dungeon:recent_games');
            if (hapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const clearOfflineQueue = () => {
    Alert.alert(
      'Clear Offline Queue',
      'This will remove all pending offline actions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            dispatch(clearAllQueued());
            if (hapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About AI Dungeon',
      'Version 1.0.0\n\nAI-powered text adventure game with infinite possibilities.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Gameplay Settings */}
        <SettingSection title="Gameplay">
          <SettingItem
            title="Haptic Feedback"
            subtitle="Feel vibrations for actions and feedback"
            icon="phone-portrait"
            value={hapticsEnabled}
            onValueChange={handleHapticToggle}
          />
          <SettingItem
            title="Notifications"
            subtitle="Get notified about game updates"
            icon="notifications"
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
          />
        </SettingSection>

        {/* Content Settings */}
        <SettingSection title="Content">
          <SettingItem
            title={`Content Rating: ${contentRating}`}
            subtitle={contentRating === 'R' ? 'Mature themes and content allowed' : 'Family-friendly content only'}
            icon="warning"
            onPress={handleContentRatingToggle}
            showArrow
          />
          <SettingItem
            title="Safety Filter"
            subtitle="Enable content moderation (overrides rating)"
            icon="shield-checkmark"
            value={safetyFilter}
            onValueChange={handleSafetyFilterToggle}
          />
        </SettingSection>

        {/* Offline & Sync Settings */}
        <SettingSection title="Offline & Sync">
          <SettingItem
            title="Offline Mode"
            subtitle="Continue playing without internet connection"
            icon="cloud-offline"
            value={offlineMode}
            onValueChange={handleOfflineModeToggle}
          />
          <SettingItem
            title="Auto Sync"
            subtitle="Automatically sync when online"
            icon="sync"
            value={autoSync}
            onValueChange={handleAutoSyncToggle}
          />
          {queuedActions.length > 0 && (
            <SettingItem
              title={`Clear Offline Queue (${queuedActions.length})`}
              subtitle="Remove pending offline actions"
              icon="trash"
              onPress={clearOfflineQueue}
              showArrow
            />
          )}
        </SettingSection>

        {/* Data Management */}
        <SettingSection title="Data">
          <SettingItem
            title={`Clear Recent Games (${recentGames.length})`}
            subtitle="Remove games from launcher"
            icon="time"
            onPress={clearRecentGamesData}
            showArrow
          />
        </SettingSection>

        {/* App Info */}
        <SettingSection title="About">
          <SettingItem
            title="About AI Dungeon"
            subtitle="App version and information"
            icon="information-circle"
            onPress={showAbout}
            showArrow
          />
        </SettingSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f3f4f6',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
});