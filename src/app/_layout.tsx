import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initAnalytics, track } from '@/lib/analytics/events';
// eslint-disable-next-line import/no-unresolved
import '../../global.css';

export default function RootLayout() {
  useEffect(() => {
    initAnalytics().then(() => track('app_opened', { source: 'cold_launch' }));
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
