import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initAnalytics, identify, track } from '@/lib/analytics/events';
import { getOrCreateUser } from '@/lib/firebase/auth';
import { migrateStorageKeys } from '@/lib/storage/migrate';
import { initSfx } from '@/lib/audio/sfx';
import { initRevenueCat } from '@/lib/subscription/revenuecat';
import { SubscriptionProvider } from '@/lib/subscription/state';
import { ThemeProvider } from '@/lib/themes/provider';
import { initSentry, identifySentryUser } from '@/lib/observability/sentry';
import { ErrorBoundary } from '@/components/observability/ErrorBoundary';
import '../../global.css';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      initSentry();
      await migrateStorageKeys();
      await Promise.all([initAnalytics(), initSfx()]);
      const userId = await getOrCreateUser();
      identify(userId);
      identifySentryUser(userId);
      await initRevenueCat(userId);
      track('app_opened', { source: 'cold_launch' });
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <SubscriptionProvider>
            <ThemeProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#f3efe7' },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="game" />
                <Stack.Screen name="daily" />
              </Stack>
            </ThemeProvider>
          </SubscriptionProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
