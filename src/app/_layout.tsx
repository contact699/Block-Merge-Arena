import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initAnalytics, identify, track } from '@/lib/analytics/events';
import { getOrCreateUser } from '@/lib/firebase/auth';
import { migrateStorageKeys } from '@/lib/storage/migrate';
import { initSfx } from '@/lib/audio/sfx';
import '../../global.css';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await migrateStorageKeys();
      await Promise.all([initAnalytics(), initSfx()]);
      const userId = await getOrCreateUser();
      identify(userId);
      track('app_opened', { source: 'cold_launch' });
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
