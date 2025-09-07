import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameScreen } from '../screens/GameScreen';
import { NewGameScreen } from '../screens/NewGameScreen';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="NewGame"
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
          name="NewGame"
          component={NewGameScreen}
          options={{
            title: 'Dungeon AI Adventure',
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
    </NavigationContainer>
  );
};