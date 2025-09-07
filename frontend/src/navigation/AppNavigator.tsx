import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GameScreen } from '../screens/GameScreen';
import { NewGameScreen } from '../screens/NewGameScreen';
import { GameLauncher } from '../screens/GameLauncher';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingFlow } from '../screens/OnboardingFlow';
import { GameLibrary } from '../screens/GameLibrary';
import { Settings } from '../screens/Settings';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['aidungeon://', 'https://aidungeon.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Games: {
            screens: {
              Launcher: 'launcher',
              NewGame: 'new-game/:genre?',
              Game: 'game/:sessionId',
            },
          },
          Library: 'library',
          Settings: 'settings',
        },
      },
      Onboarding: 'onboarding',
    },
  },
};

// Game Stack Navigator
const GameStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
          borderBottomWidth: 1,
          borderBottomColor: '#404040',
        },
        headerTintColor: '#f3f4f6',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Launcher"
        component={GameLauncher}
        options={{
          title: 'AI Dungeon',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="NewGame"
        component={NewGameScreen}
        options={{
          title: 'New Adventure',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{
          title: 'Adventure',
          headerTitleAlign: 'center',
        }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#404040',
          height: 90,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Games"
        component={GameStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" color={color} size={size} />
          ),
          tabBarLabel: 'Games',
        }}
      />
      <Tab.Screen
        name="Library"
        component={GameLibrary}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" color={color} size={size} />
          ),
          tabBarLabel: 'Library',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingFlow}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};