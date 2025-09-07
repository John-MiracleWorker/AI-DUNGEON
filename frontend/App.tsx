import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useCreateAnonymousSessionMutation } from './src/services/gameApi';
import { useAppDispatch } from './src/utils/hooks';
import { setCredentials } from './src/store/authSlice';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const [createAnonymousSession] = useCreateAnonymousSessionMutation();

  useEffect(() => {
    // Create anonymous session on app start
    const initializeAuth = async () => {
      try {
        const result = await createAnonymousSession().unwrap();
        dispatch(setCredentials({
          token: result.token,
          user: result.user,
        }));
      } catch (error) {
        console.error('Failed to create anonymous session:', error);
      }
    };

    initializeAuth();
  }, [dispatch, createAnonymousSession]);

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
