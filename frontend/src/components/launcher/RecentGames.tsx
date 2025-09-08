import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GameSession } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 16;

interface RecentGamesProps {
  recentGames: GameSession[];
  onGameSelect: (sessionId: string) => void;
  onViewAll: () => void;
}

interface GameCardProps {
  game: GameSession;
  onPress: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const lastTurn = game.turn_history[game.turn_history.length - 1];
  const turnCount = game.turn_history.length;
  
  // Extract genre from world state or infer from content
  const getGenreInfo = () => {
    // You could expand this to detect genre from world state
    return {
      icon: 'castle',
      color: '#8b5cf6',
      label: 'Adventure'
    };
  };
  
  const genreInfo = getGenreInfo();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const [imageError, setImageError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = () => {
    setImageError(false);
    setReloadKey((k) => k + 1);
  };
  
  return (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Game Image */}
      <View style={styles.imageContainer}>
        {!lastTurn?.image_url || imageError ? (
          <View style={styles.placeholderImage} testID="image-placeholder">
            <Ionicons name={genreInfo.icon as any} size={40} color={genreInfo.color} />
            {imageError && (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Image
            key={reloadKey}
            source={{ uri: lastTurn.image_url }}
            style={styles.gameImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Genre Badge */}
        <View style={[styles.genreBadge, { backgroundColor: genreInfo.color }]}>
          <Ionicons name={genreInfo.icon as any} size={14} color="white" />
          <Text style={styles.genreText}>{genreInfo.label}</Text>
        </View>
        
        {/* Turn Count */}
        <View style={styles.turnBadge}>
          <Text style={styles.turnText}>{turnCount} turns</Text>
        </View>
      </View>
      
      {/* Game Info */}
      <View style={styles.gameInfo}>
        <Text style={styles.gameTitle} numberOfLines={1}>
          {game.world_state.location || `Adventure ${game.session_id.slice(0, 8)}`}
        </Text>
        
        <Text style={styles.gameDescription} numberOfLines={2}>
          {lastTurn?.narration || 'Continue your epic adventure...'}
        </Text>
        
        <View style={styles.gameFooter}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.timeText}>
              {getTimeAgo(lastTurn?.timestamp || new Date())}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.playButton} onPress={handlePress}>
            <Ionicons name="play" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const gameDate = new Date(date);
  const diffInHours = Math.floor((now.getTime() - gameDate.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
};

export const RecentGames: React.FC<RecentGamesProps> = ({
  recentGames,
  onGameSelect,
  onViewAll,
}) => {
  
  const handleViewAll = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAll();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Adventures</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAllButton}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="start"
      >
        {recentGames.map((game, index) => (
          <GameCard
            key={game.session_id}
            game={game}
            onPress={() => onGameSelect(game.session_id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  viewAllButton: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  scrollContent: {
    paddingLeft: 4,
    paddingRight: CARD_MARGIN,
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginRight: CARD_MARGIN,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#404040',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#6b46c1',
    padding: 6,
    borderRadius: 16,
  },
  genreBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  turnBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  gameInfo: {
    padding: 16,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});