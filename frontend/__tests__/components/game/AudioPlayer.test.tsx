import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import AudioPlayer from '../../../src/components/game/AudioPlayer';

const mockStore = configureStore([]);

describe('AudioPlayer', () => {
  let store: any;
  
  beforeEach(() => {
    store = mockStore({
      settings: {
        isAudioEnabled: true,
        selectedVoice: 'alloy',
        playbackSpeed: 1.0,
      },
    });
    
    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['audio data'], { type: 'audio/mpeg' })),
      } as any)
    );
    
    // Mock HTMLAudioElement
    global.HTMLAudioElement = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when audio is enabled', () => {
    const { getByText } = render(
      <Provider store={store}>
        <AudioPlayer
          sessionId="test-session"
          narrationText="This is a test narration."
        />
      </Provider>
    );

    expect(getByText('Audio Narration')).toBeTruthy();
  });

  it('does not render when audio is disabled', () => {
    store = mockStore({
      settings: {
        isAudioEnabled: false,
        selectedVoice: 'alloy',
        playbackSpeed: 1.0,
      },
    });

    const { queryByText } = render(
      <Provider store={store}>
        <AudioPlayer
          sessionId="test-session"
          narrationText="This is a test narration."
        />
      </Provider>
    );

    expect(queryByText('Audio Narration')).toBeNull();
  });
});