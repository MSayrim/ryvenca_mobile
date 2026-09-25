import { DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from './api/errors';
import { SessionProvider } from './auth/SessionProvider';
import { ToastProvider } from './components/Toast';
import { DirectionRoot, LanguageProvider, bootstrapLanguage } from './i18n';
import { RootNavigator } from './navigation/RootNavigator';
import { colors, fontAssets } from './theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Never retry client errors (4xx); retry network/5xx twice.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

const navTheme: NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.ink,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.divider,
    notification: colors.danger,
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // Resolve the UI language (saved choice → device → en) and layout direction before the first render.
  const [languageReady, setLanguageReady] = useState(false);
  useEffect(() => {
    bootstrapLanguage()
      .catch(() => undefined)
      .finally(() => setLanguageReady(true));
  }, []);
  const ready = (fontsLoaded || !!fontError) && languageReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <LanguageProvider>
        <DirectionRoot>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <ToastProvider>
                <NavigationContainer theme={navTheme}>
                  <StatusBar style="dark" />
                  <RootNavigator />
                </NavigationContainer>
              </ToastProvider>
            </SessionProvider>
          </QueryClientProvider>
        </DirectionRoot>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
