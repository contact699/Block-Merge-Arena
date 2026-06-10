// Shared screen header — back chevron + title + optional right action.
// Replaces the hand-rolled back-button/title blocks on every secondary screen.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fontSize, fontWeight, space } from '@/lib/design/tokens';

export function ScreenHeader({
  title,
  right,
  onBack,
  backTestID = 'back-button',
}: {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  backTestID?: string;
}) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: space.sm,
      }}
    >
      <Pressable
        testID={backTestID}
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
      >
        <ChevronLeft size={22} color={colors.ember} strokeWidth={2.5} />
        <Text style={{ color: colors.ember, fontSize: fontSize.subtitle, fontWeight: fontWeight.bold }}>
          Back
        </Text>
      </Pressable>
      <Text
        style={{ color: colors.ink, fontSize: fontSize.title, fontWeight: fontWeight.black, letterSpacing: -0.6, flex: 1, textAlign: 'center' }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ minWidth: 64, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
