// Welcome Screen — Phase 1 stub. Phase 2 replaces this with the silent-demo onboarding.
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontWeight, space, fontSize, radii, shadows } from '@/lib/design/tokens';
import { useThemePalette } from '@/lib/themes/provider';
import { TactileCell } from '@/components/design/TactileCell';
import { TactileButton } from '@/components/design/TactileButton';
import { Pill } from '@/components/design/Pill';
import { markWelcomeComplete } from '@/lib/utils/tutorial';

function IntroBoardPreview() {
  const layout: string[][] = (() => {
    const grid: string[][] = Array.from({ length: 8 }, () => Array(8).fill(''));
    const set = (r: number, c: number, col: string) => (grid[r][c] = col);
    set(2, 2, 'ember'); set(2, 3, 'ember');
    set(3, 2, 'cobalt'); set(3, 3, 'cobalt'); set(3, 4, 'cobalt');
    set(4, 4, 'mustard'); set(5, 4, 'mustard');
    set(5, 5, 'forest'); set(5, 6, 'forest');
    set(6, 1, 'plum'); set(6, 2, 'plum');
    return grid;
  })();

  const boardSize = 240;
  const padding = 8;
  const gap = 2;
  const cell = (boardSize - padding * 2 - gap * 7) / 8;

  return (
    <View
      style={{
        width: boardSize,
        height: boardSize,
        borderRadius: radii.lg,
        padding,
        backgroundColor: colors.boardBgBottom,
        borderWidth: 1,
        borderColor: colors.boardCellBorder,
        ...shadows.boardLift,
      }}
    >
      {Array.from({ length: 8 }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', flex: 1 }}>
          {Array.from({ length: 8 }).map((__, c) => {
            const cellColor = layout[r][c];
            return (
              <View
                key={c}
                style={{
                  width: cell,
                  height: cell,
                  marginRight: c < 7 ? gap : 0,
                  marginBottom: r < 7 ? gap : 0,
                  borderRadius: radii.sm - 1,
                  backgroundColor: colors.boardCellBg,
                  borderWidth: 1,
                  borderColor: colors.inkRuleSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cellColor ? (
                  <TactileCell color={cellColor as never} size={cell - 2} rounded={4} />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const palette = useThemePalette();

  const handleStart = async (): Promise<void> => {
    await markWelcomeComplete();
    router.replace('/');
  };

  return (
    <SafeAreaView testID="welcome-screen" style={{ flex: 1, backgroundColor: palette.paper }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -(space.xl * 2 + space.lg),
          right: -(space.xl + space.lg),
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: colors.ember,
          opacity: 0.18,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: space.xl * 2 + space.lg,
          left: -(space.xl + space.lg),
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.cobalt,
          opacity: 0.12,
        }}
      />

      <View style={{ flex: 1, paddingHorizontal: space.xl, paddingTop: space.lg + space.md, paddingBottom: space.xl }}>
        <Pill variant="ember">NEW · 2026</Pill>

        <Text
          style={{
            marginTop: space.lg,
            fontSize: fontSize.hero + space.sm,
            lineHeight: fontSize.hero + space.sm,
            fontWeight: fontWeight.black,
            letterSpacing: -2,
            color: colors.ink,
          }}
        >
          Place.{'\n'}Clear.{'\n'}
          <Text style={{ color: colors.ember }}>Merge.</Text>
        </Text>

        <Text
          style={{
            marginTop: space.md,
            fontSize: fontSize.subtitle - 1,
            lineHeight: fontSize.subtitle + space.sm - 1,
            color: colors.inkSoft,
            maxWidth: 300,
          }}
        >
          A puzzle that rewards patience. Stack pieces, clear lines, then watch
          leftover gems merge into multipliers.
        </Text>

        <View style={{ alignItems: 'center', marginTop: space.xl + space.sm }}>
          <View style={{ position: 'relative' }}>
            <IntroBoardPreview />
            <View
              style={{
                position: 'absolute',
                top: -(space.md - 2),
                right: -(space.md - 2),
                paddingHorizontal: space.md - 2,
                paddingVertical: space.xs + 1,
                backgroundColor: colors.ember,
                borderRadius: radii.pill,
                borderWidth: 1.5,
                borderColor: colors.paper,
                ...shadows.buttonEmber,
              }}
            >
              <Text style={{ color: colors.paper, fontWeight: fontWeight.black, fontSize: fontSize.subtitle + 1 }}>3×</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 'auto', gap: space.sm + 2 }}>
          <TactileButton testID="lets-play-button" variant="primary" onPress={handleStart}>
            Start playing
          </TactileButton>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: 'center', paddingVertical: space.md - 2 })}
          >
            <Text style={{ color: colors.inkSoft, fontWeight: fontWeight.semibold }}>I have an account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
