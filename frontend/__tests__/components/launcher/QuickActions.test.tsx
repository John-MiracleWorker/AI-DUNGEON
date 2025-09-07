import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickActions } from '../../../src/components/launcher/QuickActions';
import * as Haptics from 'expo-haptics';

// Mock haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

const mockQuickActions = [
  { id: 'quick-start', label: 'Quick Adventure', icon: 'flash', action: 'quick-start' as const },
  { id: 'continue', label: 'Continue', icon: 'play', action: 'continue' as const },
];

const mockLastSession = {
  session_id: 'test-session',
  world_state: {
    location: 'Test Location',
    inventory: [],
    character_stats: {},
  },
  turn_history: [],
  quick_actions: [],
};

describe('QuickActions', () => {
  const mockProps = {
    quickActions: mockQuickActions,
    onQuickStart: jest.fn(),
    onContinueGame: jest.fn(),
    onNewGame: jest.fn(),
    lastPlayedSession: mockLastSession,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quick start button correctly', () => {
    const { getByText } = render(<QuickActions {...mockProps} />);
    
    expect(getByText('Quick Adventure')).toBeTruthy();
    expect(getByText('Start instantly')).toBeTruthy();
  });

  it('renders continue button when last session exists', () => {
    const { getByText } = render(<QuickActions {...mockProps} />);
    
    expect(getByText('Continue Adventure')).toBeTruthy();
    expect(getByText('Test Location')).toBeTruthy();
  });

  it('calls onQuickStart when quick start button is pressed', async () => {
    const { getByText } = render(<QuickActions {...mockProps} />);
    
    fireEvent.press(getByText('Quick Adventure'));
    
    await waitFor(() => {
      expect(mockProps.onQuickStart).toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });
  });

  it('calls onContinueGame when continue button is pressed', async () => {
    const { getByText } = render(<QuickActions {...mockProps} />);
    
    fireEvent.press(getByText('Continue Adventure'));
    
    await waitFor(() => {
      expect(mockProps.onContinueGame).toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });
  });

  it('calls onNewGame when new game button is pressed', async () => {
    const { getByText } = render(<QuickActions {...mockProps} />);
    
    fireEvent.press(getByText('New Game'));
    
    await waitFor(() => {
      expect(mockProps.onNewGame).toHaveBeenCalled();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });
  });

  it('does not render continue button when no last session', () => {
    const propsWithoutSession = {
      ...mockProps,
      lastPlayedSession: null,
    };
    
    const { queryByText } = render(<QuickActions {...propsWithoutSession} />);
    
    expect(queryByText('Continue Adventure')).toBeNull();
  });

  it('renders action grid with new game and library options', () => {
    const { getByText } = render(<QuickActions {...mockProps} />);
    
    expect(getByText('New Game')).toBeTruthy();
    expect(getByText('Library')).toBeTruthy();
  });
});