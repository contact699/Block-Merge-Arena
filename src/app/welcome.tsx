// Welcome Screen — Phase 1 stub. Phase 2 replaces this with the silent-demo onboarding.
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontWeight } from '@/lib/design/tokens';
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
        borderRadius: 14,
        padding,
        backgroundColor: '#0a0805',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10,
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
                  borderRadius: 5,
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.04)',
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
          top: -80,
          right: -60,
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
          bottom: 80,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.cobalt,
          opacity: 0.12,
        }}
      />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 }}>
        <Pill variant="ember">NEW · 2026</Pill>

        <Text
          style={{
            marginTop: 18,
            fontSize: 56,
            lineHeight: 56,
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
            marginTop: 14,
            fontSize: 14,
            lineHeight: 20,
            color: colors.inkSoft,
            maxWidth: 300,
          }}
        >
          A puzzle that rewards patience. Stack pieces, clear lines, then watch
          leftover gems merge into multipliers.
        </Text>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <View style={{ position: 'relative' }}>
            <IntroBoardPreview />
            <View
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                paddingHorizontal: 12,
                paddingVertical: 5,
                backgroundColor: colors.ember,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: 'white',
                shadowColor: colors.ember,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: fontWeight.black, fontSize: 16 }}>3×</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 'auto', gap: 10 }}>
          <TactileButton testID="lets-play-button" variant="primary" onPress={handleStart}>
            Start playing
          </TactileButton>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignItems: 'center', paddingVertical: 12 })}
          >
            <Text style={{ color: colors.inkSoft, fontWeight: fontWeight.semibold }}>I have an account</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
