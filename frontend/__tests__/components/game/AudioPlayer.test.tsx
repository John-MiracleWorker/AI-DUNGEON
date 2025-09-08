import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import AudioPlayer, { formatTime } from '../../../src/components/game/AudioPlayer';

jest.mock('@react-native-community/slider', () => 'Slider');

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          setStatusAsync: jest.fn(),
          playAsync: jest.fn(),
          pauseAsync: jest.fn(),
          unloadAsync: jest.fn(),
          getStatusAsync: jest.fn().mockResolvedValue({
            isLoaded: true,
            durationMillis: 100000,
            positionMillis: 0,
            isPlaying: false,
            didJustFinish: false,
          }),
          setOnPlaybackStatusUpdate: jest.fn(),
          setPositionAsync: jest.fn(),
        }
      })
    }
  }
}));

const mockStore = configureStore([]);

const mockGenerateSpeech = jest.fn();

jest.mock('../../../src/services/gameApi', () => ({
  ...jest.requireActual('../../../src/services/gameApi'),
  useGenerateSpeechMutation: () => [mockGenerateSpeech, { isLoading: false }],
}));

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

    mockGenerateSpeech.mockClear();
    mockGenerateSpeech.mockReturnValue({
      unwrap: () => Promise.resolve(new Blob(['audio data'], { type: 'audio/mpeg' })),
    });
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

  it('calls generateSpeech when component mounts', async () => {
    render(
      <Provider store={store}>
        <AudioPlayer
          sessionId="test-session"
          narrationText="This is a test narration."
        />
      </Provider>
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockGenerateSpeech).toHaveBeenCalledWith({
      sessionId: 'test-session',
      body: {
        text: 'This is a test narration.',
        voice: 'alloy',
        speed: 1.0,
        quality: 'standard',
      }
    });
  });
});

describe('formatTime', () => {
  it('formats durations below one minute', () => {
    expect(formatTime(5)).toBe('0:05');
  });

  it('formats durations above one minute', () => {
    expect(formatTime(65)).toBe('1:05');
  });
});
