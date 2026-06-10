// Standardized async UI: loading spinner, error+retry, empty message, or content.
// Replaces ad-hoc `loading ? … :` blocks whose catch handlers only console.error
// (audit M3.3 — users now get a retry instead of an infinite spinner).
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { colors, fontSize, space } from '@/lib/design/tokens';
import { TactileButton } from '@/components/design/TactileButton';
import { asyncState } from './asyncState';

export function AsyncStateView({
  loading,
  error,
  isEmpty,
  emptyMessage = 'Nothing here yet.',
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  const phase = asyncState({ loading, error, isEmpty });

  if (phase === 'loading') {
    return (
      <View testID="async-loading" style={{ alignItems: 'center', paddingVertical: space.xl * 2 }}>
        <ActivityIndicator color={colors.ember} />
      </View>
    );
  }
  if (phase === 'error') {
    return (
      <View testID="async-error" style={{ alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.lg, gap: space.md }}>
        <Text style={{ color: colors.inkSoft, fontSize: fontSize.body, textAlign: 'center' }}>{error}</Text>
        {onRetry && (
          <TactileButton testID="async-retry" variant="ink" onPress={onRetry}>Try again</TactileButton>
        )}
      </View>
    );
  }
  if (phase === 'empty') {
    return (
      <View testID="async-empty" style={{ alignItems: 'center', paddingVertical: space.xl * 2, paddingHorizontal: space.lg }}>
        <Text style={{ color: colors.inkDim, fontSize: fontSize.body, textAlign: 'center' }}>{emptyMessage}</Text>
      </View>
    );
  }
  return <>{children}</>;
}
