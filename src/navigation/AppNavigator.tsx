import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { TabNavigator } from './TabNavigator';
import { TVNavigator } from './TVNavigator';
import { DetailScreen, SplashScreen, LoginScreen, SubscriptionScreen, AccessDeniedScreen } from '../screens';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { verifySubscription, subscribeToSubscription } from '../subscription/validation';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Inner navigator with access gate logic.
 */
const AppNavigatorInner: React.FC = () => {
  const { state: authState, initialized } = useAuth();
  const navigationRef = useRef<any>(null);
  const accessCheckedRef = useRef(false);

  // Handle access gate logic
  useEffect(() => {
    if (!initialized) return;

    let unsubscribe: (() => void) | null = null;

    const checkAccess = async () => {
      if (!authState.user) {
        // Not authenticated -> Login
        if (navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        return;
      }

      try {
        // Subscribe to real-time subscription changes
        const unsubscribe = subscribeToSubscription((hasAccess, state) => {
          if (!hasAccess) {
            if (state.keyStatus === 'revoked' || state.keyStatus === 'blocked') {
              navigationRef.current?.navigate('AccessDenied');
            } else {
              navigationRef.current?.navigate('Subscription');
            }
          }
        });
        
        unsubscribe = unsubscribe;

        // Initial check
        const { hasAccess, subscriptionState: state } = await verifySubscription();
        
        if (!hasAccess) {
          if (state.keyStatus === 'revoked' || state.keyStatus === 'blocked') {
            navigationRef.current?.navigate('AccessDenied');
          } else {
            navigationRef.current?.navigate('Subscription');
          }
        }
      } catch (error) {
        console.error('Access check error:', error);
      }
    };

    if (!accessCheckedRef.current) {
      accessCheckedRef.current = true;
      checkAccess();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialized, authState.user]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        
        {/* Main content - requires auth + subscription */}
        <Stack.Screen
          name="Main"
          component={Platform.isTV ? TVNavigator : TabNavigator}
        />
        
        {/* Detail screen - requires auth + subscription */}
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        
        {/* Login - for unauthenticated users */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            animation: 'fade',
          }}
        />
        
        {/* Subscription - for authenticated but no valid subscription */}
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        
        {/* Access Denied - for blocked/revoked subscriptions */}
        <Stack.Screen
          name="AccessDenied"
          component={AccessDeniedScreen}
          options={{
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * Wrapper to ensure Firebase/Auth is initialized before rendering navigation.
 */
const AuthInitializer: React.FC = () => {
  const { initialized, loading } = useAuth();
  
  if (!initialized || loading) {
    return <SplashScreen />;
  }
  
  return <AppNavigatorInner />;
};

/**
 * Main App Navigator with Auth Provider.
 */
export const AppNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <AuthInitializer />
    </AuthProvider>
  );
};

export default AppNavigator;
