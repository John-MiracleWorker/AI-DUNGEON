import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { StyleStep } from '../../../src/components/adventure/StyleStep';

// Mock the hooks
jest.mock('../../../src/utils/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) => {
    // Mock different states for testing
    if (selector.toString().includes('selectCurrentAdventure')) {
      // Return the mock adventure state based on test context
      return mockAdventureState;
    }
    return null;
  }
}));

// Mock adventure state
let mockAdventureState: any = null;

// Mock the store
const mockStore: any = {
  getState: () => ({}),
  subscribe: () => {},
  dispatch: () => {}
};

describe('StyleStep Component', () => {
  beforeEach(() => {
    mockAdventureState = {
      title: 'Test Adventure',
      setting: {
        time_period: {
          type: 'predefined',
          value: 'medieval'
        },
        environment: 'A dark and mysterious forest with ancient trees and hidden dangers'
      },
      style_preferences: {
        tone: 'serious',
        complexity: 'complex',
        pacing: 'moderate'
      }
    };
  });

  it('renders correctly with complete adventure data', () => {
    const component = render(
      <Provider store={mockStore}>
        <StyleStep />
      </Provider>
    );
    expect(component).toBeTruthy();
  });

  it('renders correctly with minimal adventure data', () => {
    mockAdventureState = {
      title: 'Minimal Adventure',
      setting: {
        time_period: 'modern',
        environment: 'City streets'
      },
      style_preferences: {}
    };
    
    const component = render(
      <Provider store={mockStore}>
        <StyleStep />
      </Provider>
    );
    expect(component).toBeTruthy();
  });

  it('renders correctly with null adventure data', () => {
    mockAdventureState = null;
    
    const component = render(
      <Provider store={mockStore}>
        <StyleStep />
      </Provider>
    );
    expect(component).toBeTruthy();
  });

  it('renders correctly with undefined nested properties', () => {
    mockAdventureState = {
      title: 'Incomplete Adventure'
      // Missing setting and style_preferences
    };
    
    const component = render(
      <Provider store={mockStore}>
        <StyleStep />
      </Provider>
    );
    expect(component).toBeTruthy();
  });
});