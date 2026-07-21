import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../constants/theme';
import { syncManager } from '../services/sync';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useAuthStore } from '../store/authStore';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.secondary,
    error: Colors.error,
    background: Colors.background,
    surface: Colors.surface,
    onPrimary: Colors.textLight,
    onSecondary: Colors.textLight,
    onBackground: Colors.textPrimary,
    onSurface: Colors.textPrimary,
    outline: Colors.border,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: DarkColors.primary,
    secondary: DarkColors.secondary,
    error: DarkColors.error,
    background: DarkColors.background,
    surface: DarkColors.surface,
    onPrimary: DarkColors.textLight,
    onSecondary: DarkColors.textLight,
    onBackground: DarkColors.textPrimary,
    onSurface: DarkColors.textPrimary,
    outline: DarkColors.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    try {
      syncManager.start();
    } catch (err) {
      console.error('Failed to start sync manager:', err);
    }
    return () => {
      try { syncManager.stop(); } catch {}
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ErrorBoundary>
        </PaperProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
