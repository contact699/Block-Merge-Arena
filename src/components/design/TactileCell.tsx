import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { blockColors, radii, type BlockColorKey } from '@/lib/design/tokens';

interface TactileCellProps {
  color: BlockColorKey;
  size: number;
  rounded?: number;
  style?: ViewStyle;
}

export function TactileCell({ color, size, rounded, style }: TactileCellProps) {
  const c = blockColors[color];
  const r = rounded ?? Math.max(4, Math.round(size * 0.18));
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: r,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[c.base, c.deep]}
        style={{ flex: 1, borderRadius: r }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Top inner highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Math.max(2, Math.round(size * 0.18)),
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderTopLeftRadius: r,
          borderTopRightRadius: r,
        }}
      />
      {/* Specular shine highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: Math.round(size * 0.08),
          left: Math.round(size * 0.16),
          width: Math.round(size * 0.36),
          height: Math.round(size * 0.22),
          borderRadius: radii.pill,
          backgroundColor: 'rgba(255,255,255,0.45)',
          opacity: 0.85,
        }}
      />
    </View>
  );
}
