import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetSavedGamesQuery } from '../services/gameApi';
import { SavedGame } from '../types';

interface SavedGameCardProps {
  game: SavedGame;
  onSelect: (game: SavedGame) => void;
  onDelete: (game: SavedGame) => void;
}

const SavedGameCard: React.FC<SavedGameCardProps> = ({ game, onSelect, onDelete }) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Save',
      `Are you sure you want to delete "${game.save_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(game) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.gameCard} onPress={() => onSelect(game)}>
      <LinearGradient
        colors={['#2a2a3a', '#1a1a2a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Preview Image or Icon */}
        <View style={styles.previewContainer}>
          {game.preview_image ? (
            <View style={styles.previewImage}>
              <Text style={styles.previewText}>IMG</Text>
            </View>
          ) : (
            <View style={styles.previewIcon}>
              <Ionicons name="save" size={24} color="#8b5cf6" />
            </View>
          )}
        </View>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.gameName} numberOfLines={1}>
            {game.save_name}
          </Text>
          <Text style={styles.gameDetails}>
            {game.turn_count} turns • {formatDate(game.created_at)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const GameLibrary: React.FC = () => {
  const navigation = useNavigation();
  const {
    data: savedGamesData,
    isLoading,
    error,
    refetch
  } = useGetSavedGamesQuery();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSelectGame = (game: SavedGame) => {
    // Navigate to the game using the session_id
    (navigation as any).navigate('Games', {
      screen: 'Game',
      params: { sessionId: game.session_id }
    });
  };

  const handleDeleteGame = (game: SavedGame) => {
    // TODO: Implement delete functionality
    Alert.alert('Delete', 'Delete functionality will be implemented in the next update.');
  };

  const savedGames = savedGamesData?.saves || [];

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading saved games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Game Library</Text>
          <Text style={styles.subtitle}>
            {savedGames.length > 0
              ? `${savedGames.length} saved game${savedGames.length !== 1 ? 's' : ''}`
              : 'No saved games yet'
            }
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.errorText}>Failed to load saved games</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {savedGames.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>No Saved Games</Text>
            <Text style={styles.emptyText}>
              Save your adventures during gameplay to access them here later.
            </Text>
            <TouchableOpacity
              style={styles.startGameButton}
              onPress={() => (navigation as any).navigate('Games')}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.startGameText}>Start New Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {savedGames.length > 0 && (
          <View style={styles.gamesList}>
            {savedGames.map((game: SavedGame) => (
              <SavedGameCard
                key={game.save_id}
                game={game}
                onSelect={handleSelectGame}
                onDelete={handleDeleteGame}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#2a1a1a',
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
  },
  startGameText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  gamesList: {
    gap: 12,
  },
  gameCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  previewContainer: {
    marginRight: 16,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#404040',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 4,
  },
  gameDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actions: {
    marginLeft: 16,
  },
  deleteButton: {
    padding: 8,
  },
});