import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useCreateAnonymousSessionMutation } from './src/services/gameApi';
import { useAppDispatch } from './src/utils/hooks';
import { setCredentials } from './src/store/authSlice';
import { setOnlineStatus, setOfflineMode } from './src/store/offlineSlice';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const [createAnonymousSession] = useCreateAnonymousSessionMutation();
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp();

    // Set up network monitoring
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setOnlineStatus(state.isConnected ?? false));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const initializeApp = async () => {
    setIsInitializing(true);
    setInitError(null);
    try {
      const result = await createAnonymousSession().unwrap();
      dispatch(setCredentials({
        token: result.token,
        user: result.user,
      }));

      await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setInitError('Failed to initialize app.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleOfflineMode = () => {
    dispatch(setOnlineStatus(false));
    dispatch(setOfflineMode(true));
    setInitError(null);
  };

  if (isInitializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{initError}</Text>
        <Button title="Retry" onPress={initializeApp} />
        <View style={styles.spacer} />
        <Button title="Offline Mode" onPress={handleOfflineMode} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <AppNavigator />
    </>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  spacer: {
    height: 12,
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
