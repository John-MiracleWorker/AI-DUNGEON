import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SwipeableInputBox } from '../../../src/components/game/SwipeableInputBox';
import * as Haptics from 'expo-haptics';

// Mock haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

describe('SwipeableInputBox', () => {
  const mockProps = {
    onSubmit: jest.fn(),
    onUndo: jest.fn(),
    onQuickAction: jest.fn(),
    placeholder: 'What do you do?',
    quickActions: ['Look around', 'Move forward', 'Attack'],
    enableHaptics: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with placeholder text', () => {
    const { getByPlaceholderText } = render(<SwipeableInputBox {...mockProps} />);
    
    expect(getByPlaceholderText('What do you do?')).toBeTruthy();
  });

  it('renders quick actions when provided', () => {
    const { getByText } = render(<SwipeableInputBox {...mockProps} />);
    
    expect(getByText('Look around')).toBeTruthy();
    expect(getByText('Move forward')).toBeTruthy();
    expect(getByText('Attack')).toBeTruthy();
  });

  it('shows character count', () => {
    const { getByText } = render(<SwipeableInputBox {...mockProps} />);
    
    expect(getByText('0/500')).toBeTruthy();
  });

  it('updates character count when text is entered', () => {
    const { getByPlaceholderText, getByText } = render(<SwipeableInputBox {...mockProps} />);
    
    const input = getByPlaceholderText('What do you do?');
    fireEvent.changeText(input, 'Hello');
    
    expect(getByText('5/500')).toBeTruthy();
  });

  it('calls onSubmit when text is entered and submit is pressed', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <SwipeableInputBox {...mockProps} />
    );
    
    const input = getByPlaceholderText('What do you do?');
    fireEvent.changeText(input, 'Test action');
    
    // Find submit button by looking for send icon
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith('Test action');
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });
  });

  it('shows warning haptic when trying to submit empty input', async () => {
    const { getByTestId } = render(<SwipeableInputBox {...mockProps} />);
    
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  it('sets input value when quick action is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <SwipeableInputBox {...mockProps} />
    );
    
    fireEvent.press(getByText('Look around'));
    
    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });
    
    const input = getByPlaceholderText('What do you do?');
    expect(input.props.value).toBe('Look around');
  });

  it('shows gesture hints', () => {
    const { getByText } = render(<SwipeableInputBox {...mockProps} />);
    
    expect(getByText('← Swipe left to undo | Swipe right for quick action →')).toBeTruthy();
  });

  it('disables submit button when input is empty', () => {
    const { getByTestId } = render(<SwipeableInputBox {...mockProps} />);
    
    const submitButton = getByTestId('submit-button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables submit button when input has text', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <SwipeableInputBox {...mockProps} />
    );
    
    const input = getByPlaceholderText('What do you do?');
    fireEvent.changeText(input, 'Test');
    
    const submitButton = getByTestId('submit-button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);
  });
});