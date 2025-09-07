import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector, useAppDispatch } from '../utils/hooks';
import { addToRecentGames, setLastPlayed } from '../store/launcherSlice';
import { QuickActions } from '../components/launcher/QuickActions';
import { RecentGames } from '../components/launcher/RecentGames';
import { UserProfile } from '../components/launcher/UserProfile';

export const GameLauncher: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { recentGames, lastPlayedSession, quickActions } = useAppSelector((state) => state.launcher);
  const { currentSession } = useAppSelector((state) => state.game);
  const { isOnline } = useAppSelector((state) => state.offline);
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  useEffect(() => {
    loadLauncherData();
  }, []);
  
  useEffect(() => {
    // Update recent games when current session changes
    if (currentSession) {
      dispatch(addToRecentGames(currentSession));
      dispatch(setLastPlayed(currentSession));
      saveLauncherData();
    }
  }, [currentSession, dispatch]);
  
  const loadLauncherData = async () => {
    try {
      const recentGamesData = await AsyncStorage.getItem('@ai_dungeon:recent_games');
      if (recentGamesData) {
        const games = JSON.parse(recentGamesData);
        games.forEach((game: any) => {
          dispatch(addToRecentGames(game));
        });
        
        if (games.length > 0) {
          dispatch(setLastPlayed(games[0]));
        }
      }
    } catch (error) {
      console.error('Error loading launcher data:', error);
    }
  };
  
  const saveLauncherData = async () => {
    try {
      await AsyncStorage.setItem('@ai_dungeon:recent_games', JSON.stringify(recentGames));
    } catch (error) {
      console.error('Error saving launcher data:', error);
    }
  };
  
  const handleQuickStart = () => {
    // Navigate to new game with quick start parameters
    navigation.navigate('NewGame' as never, { quickStart: true } as never);
  };
  
  const handleContinueGame = (sessionId: string) => {
    navigation.navigate('Game' as never, { sessionId } as never);
  };
  
  const handleNewGame = () => {
    navigation.navigate('NewGame' as never);
  };
  
  const handleViewLibrary = () => {
    navigation.navigate('Library' as never);
  };
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadLauncherData();
    setRefreshing(false);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <LinearGradient
        colors={['#1a1a1a', '#2a1a3a', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.titleText}>Ready for Adventure?</Text>
            
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Text style={styles.offlineText}>Offline Mode</Text>
              </View>
            )}
          </View>
          
          {/* Quick Actions */}
          <QuickActions
            quickActions={quickActions}
            onQuickStart={handleQuickStart}
            onContinueGame={lastPlayedSession ? () => handleContinueGame(lastPlayedSession.session_id) : undefined}
            onNewGame={handleNewGame}
            lastPlayedSession={lastPlayedSession}
          />
          
          {/* Recent Games */}
          {recentGames.length > 0 && (
            <RecentGames
              recentGames={recentGames}
              onGameSelect={handleContinueGame}
              onViewAll={handleViewLibrary}
            />
          )}
          
          {/* User Profile Section */}
          <UserProfile />
          
          {/* Quick Tips or Getting Started */}
          {recentGames.length === 0 && (
            <View style={styles.gettingStartedSection}>
              <Text style={styles.sectionTitle}>Getting Started</Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>🎯 Quick Start</Text>
                <Text style={styles.tipText}>
                  Tap "Quick Adventure" for an instant game with smart defaults based on popular choices.
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>🎨 Customize Your Experience</Text>
                <Text style={styles.tipText}>
                  Create a new game to choose your genre, art style, and narrative preferences.
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>💾 Save & Continue</Text>
                <Text style={styles.tipText}>
                  Your adventures are automatically saved. Pick up where you left off anytime!
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: '400',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f3f4f6',
    textAlign: 'center',
    marginTop: 4,
  },
  offlineIndicator: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  offlineText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  gettingStartedSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: 'rgba(45, 27, 105, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100, // Extra space for tab bar
  },
});