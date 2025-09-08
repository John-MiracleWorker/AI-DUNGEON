import React from 'react';
import { render } from '@testing-library/react-native';
import { MobileOptimizedChat } from '../../../src/components/game/MobileOptimizedChat';
import { Turn } from '../../../src/types';

describe('MobileOptimizedChat Component', () => {
  const baseTurn: Turn = {
    turn_id: 'test_turn_1',
    turn_number: 1,
    player_input: 'Look around',
    narration: 'You find yourself in a mysterious cave filled with glowing crystals.',
    image_prompt: 'A mysterious cave with glowing crystals',
    image_url: 'https://example.com/cave.jpg',
    quick_actions: [],
    world_state_snapshot: {
      location: 'Crystal Cave',
      inventory: [],
      npcs: [],
      flags: {},
      current_chapter: 'Chapter 1',
    },
    timestamp: new Date('2024-01-01'),
    processing_metadata: {
      ai_response_time: 1000,
      image_generation_time: 2000,
      tokens_used: 150,
    },
  };

  it('shows placeholder when image_url is empty', () => {
    const turnWithoutImage = { ...baseTurn, image_url: '' } as any;
    const { getByTestId } = render(
      <MobileOptimizedChat turns={[turnWithoutImage]} />
    );
    expect(getByTestId('image-placeholder')).toBeTruthy();
  });
});
