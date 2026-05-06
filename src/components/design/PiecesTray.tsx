// Shared tactile pieces tray used by game.tsx and daily.tsx.
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@/components/design/GlassCard';
import { TactileCell } from '@/components/design/TactileCell';
import { colors, fontWeight, resolveBlockColor } from '@/lib/design/tokens';
import type { GamePiece } from '@/lib/types/game';

function TrayPiece({ piece, holding }: { piece: GamePiece; holding?: boolean }) {
  const cellSize = holding ? 14 : 12;
  const gridW = piece.width;
  const gridH = piece.height;
  const grid: boolean[][] = Array.from({ length: gridH }, () => Array(gridW).fill(false));
  piece.shape.forEach((p) => {
    if (p.row < gridH && p.col < gridW) grid[p.row][p.col] = true;
  });
  const colorKey = resolveBlockColor(piece.color);
  return (
    <View>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((filled, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                margin: 1,
              }}
            >
              {filled ? <TactileCell color={colorKey} size={cellSize} rounded={3} /> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PiecesTray({
  pieces,
  selectedIndex,
  onSelect,
}: {
  pieces: GamePiece[];
  selectedIndex: number | undefined;
  onSelect: (p: GamePiece, i: number) => void;
}) {
  // Pad to 3 slots so the "holding" slot stays in the middle visually.
  const slots: (GamePiece | null)[] = [pieces[0] ?? null, pieces[1] ?? null, pieces[2] ?? null];
  return (
    <GlassCard style={{ padding: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 1.6, color: colors.ink }}>
          NEXT PIECES
        </Text>
        <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, letterSpacing: 1.4, color: colors.inkSoft }}>
          {pieces.length} / 3
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 8 }}>
        {slots.map((piece, i) => {
          const active = selectedIndex === i;
          const isMiddle = i === 1;
          if (!piece) {
            return (
              <View
                key={i}
                style={{
                  flex: isMiddle ? 1.2 : 1,
                  height: 64,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(22,20,15,0.06)',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
            );
          }
          return (
            <Pressable
              key={piece.id}
              onPress={() => onSelect(piece, i)}
              style={{
                flex: isMiddle ? 1.2 : 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: active ? 14 : 12,
                borderWidth: active ? 0 : 1,
                borderColor: 'rgba(22,20,15,0.06)',
                backgroundColor: active ? 'transparent' : 'rgba(255,255,255,0.5)',
                overflow: 'hidden',
                shadowColor: active ? colors.ember : 'transparent',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: active ? 0.5 : 0,
                shadowRadius: 18,
                elevation: active ? 6 : 0,
              }}
            >
              {active && (
                <LinearGradient
                  colors={[colors.emberLight, colors.ember]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <TrayPiece piece={piece} holding={active} />
              {active && (
                <View
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: colors.ink,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: colors.paper, fontSize: 8, fontWeight: fontWeight.heavy, letterSpacing: 1.2 }}>
                    HOLDING
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}
