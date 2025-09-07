import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

class HapticsService {
  private isEnabled = true;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      const hapticsEnabled = await AsyncStorage.getItem('@ai_dungeon:haptics_enabled');
      this.isEnabled = hapticsEnabled !== 'false'; // Default to enabled
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading haptics preference:', error);
      this.isEnabled = true; // Default to enabled on error
    }
  }

  async setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      await AsyncStorage.setItem('@ai_dungeon:haptics_enabled', enabled.toString());
    } catch (error) {
      console.error('Error saving haptics preference:', error);
    }
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  // Light haptic feedback for subtle interactions
  async light() {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Medium haptic feedback for button presses
  async medium() {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Heavy haptic feedback for important actions
  async heavy() {
    if (!this.isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Success feedback
  async success() {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Warning feedback
  async warning() {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Error feedback
  async error() {
    if (!this.isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Selection feedback for discrete selection changes
  async selection() {
    if (!this.isEnabled) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }

  // Contextual haptics for different game events
  async turnSubmitted() {
    await this.medium();
  }

  async quickActionPressed() {
    await this.light();
  }

  async gameStarted() {
    await this.success();
  }

  async gameError() {
    await this.error();
  }

  async navigationPress() {
    await this.light();
  }

  async settingChanged() {
    await this.selection();
  }

  async longPress() {
    await this.heavy();
  }

  async swipeGesture() {
    await this.light();
  }

  async imagePressed() {
    await this.light();
  }
}

// Singleton instance
export const hapticsService = new HapticsService();

// Convenience hook for React components
export const useHaptics = () => {
  return hapticsService;
};