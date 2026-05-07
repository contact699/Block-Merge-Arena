import { View, Text, Pressable } from 'react-native';
import { SentryErrorBoundary } from '@/lib/observability/sentry';
import { colors, fontWeight } from '@/lib/design/tokens';

function FallbackUI({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontSize: 24, fontWeight: fontWeight.black, color: colors.ink, letterSpacing: -1 }}>
        Something broke.
      </Text>
      <Text style={{ color: colors.inkSoft, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        We've sent the report. Tap below to try again.
      </Text>
      <Text style={{ color: colors.inkDim, fontSize: 11, marginTop: 18, textAlign: 'center' }}>
        {error.message}
      </Text>
      <Pressable
        onPress={resetError}
        style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.ember, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', fontWeight: fontWeight.heavy }}>Reload</Text>
      </Pressable>
    </View>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary fallback={({ error, resetError }) => <FallbackUI error={error as Error} resetError={resetError} />}>
      {children}
    </SentryErrorBoundary>
  );
}
