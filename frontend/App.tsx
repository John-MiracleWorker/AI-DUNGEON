import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useCreateAnonymousSessionMutation } from './src/services/gameApi';
import { useAppDispatch } from './src/utils/hooks';
import { setCredentials } from './src/store/authSlice';
import { setOnlineStatus } from './src/store/offlineSlice';

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

  useEffect(() => {
    // Initialize app
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
    try {
      // Create anonymous session on app start
      const result = await createAnonymousSession().unwrap();
      dispatch(setCredentials({
        token: result.token,
        user: result.user,
      }));
      
      // Request notification permissions
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
