import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { TurnDisplay } from './TurnDisplay';
import { Turn } from '../../types';

interface ChatContainerProps {
  turns: Turn[];
  autoScroll?: boolean;
  isLoading?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  turns, 
  autoScroll = true,
  isLoading = false 
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [turns, autoScroll]);

  if (turns.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Your adventure awaits...
        </Text>
        <Text style={styles.emptySubtext}>
          Start a new game to begin your journey!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {turns.map((turn, index) => (
          <TurnDisplay
            key={turn.turn_id}
            turn={turn}
            isLatest={index === turns.length - 1}
          />
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
            <Text style={styles.loadingText}>
              The AI is crafting your next adventure...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 32,
  },
  emptyText: {
    color: '#f3f4f6',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b46c1',
    marginHorizontal: 3,
  },
  dot1: {
    // Animation would be added here in a real implementation
  },
  dot2: {
    // Animation would be added here in a real implementation
  },
  dot3: {
    // Animation would be added here in a real implementation
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});