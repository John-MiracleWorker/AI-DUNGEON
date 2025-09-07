import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { QuickAction } from '../../store/launcherSlice';
import { GameSession } from '../../types';

const { width } = Dimensions.get('window');

interface QuickActionsProps {
  quickActions: QuickAction[];
  onQuickStart: () => void;
  onContinueGame?: () => void;
  onNewGame: () => void;
  lastPlayedSession?: GameSession | null;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  quickActions,
  onQuickStart,
  onContinueGame,
  onNewGame,
  lastPlayedSession,
}) => {
  
  const handleActionPress = async (action: QuickAction) => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (action.action) {
      case 'quick-start':
        onQuickStart();
        break;
      case 'continue':
        if (onContinueGame) {
          onContinueGame();
        }
        break;
      case 'new-game':
        onNewGame();
        break;
      default:
        break;
    }
  };
  
  const renderQuickStartButton = () => (
    <TouchableOpacity
      style={styles.primaryActionButton}
      onPress={() => handleActionPress({ id: 'quick-start', label: 'Quick Adventure', icon: 'flash', action: 'quick-start' })}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#8b5cf6', '#06d6a0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryGradient}
      >
        <Ionicons name="flash" size={28} color="white" />
        <Text style={styles.primaryButtonText}>Quick Adventure</Text>
        <Text style={styles.primaryButtonSubtext}>Start instantly</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
  
  const renderContinueButton = () => {
    if (!lastPlayedSession) return null;
    
    return (
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => handleActionPress({ id: 'continue', label: 'Continue', icon: 'play', action: 'continue' })}
        activeOpacity={0.8}
      >
        <View style={styles.continueContent}>
          <View style={styles.continueIcon}>
            <Ionicons name="play" size={20} color="#10b981" />
          </View>
          <View style={styles.continueText}>
            <Text style={styles.continueTitle}>Continue Adventure</Text>
            <Text style={styles.continueSubtitle} numberOfLines={1}>
              {lastPlayedSession.world_state.location || 'Last session'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderActionGrid = () => {
    const otherActions = [
      { id: 'new-game', label: 'New Game', icon: 'add-circle', action: 'new-game' as const },
      { id: 'library', label: 'Library', icon: 'library', action: 'load-game' as const },
    ];
    
    return (
      <View style={styles.actionGrid}>
        {otherActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => {
              if (action.action === 'new-game') {
                handleActionPress(action);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name={action.icon as any} size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      {/* Primary Quick Start Button */}
      {renderQuickStartButton()}
      
      {/* Continue Game Button */}
      {renderContinueButton()}
      
      {/* Action Grid */}
      {renderActionGrid()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 16,
  },
  primaryActionButton: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  primaryButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  continueText: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  continueSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2, // Responsive width accounting for padding
    borderWidth: 1,
    borderColor: '#404040',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
    textAlign: 'center',
  },
});