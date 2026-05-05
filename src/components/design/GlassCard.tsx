import { View, type ViewStyle } from 'react-native';
import { radii, shadows } from '@/lib/design/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

// Cream "glass" card — light translucent panel with subtle inner-light + lift.
export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: 'rgba(22,20,15,0.08)',
        },
        shadows.cardLift,
        style,
      ]}
    >
      {/* Top inner-light */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
        }}
      />
      {children}
    </View>
  );
}

// Dark "deep" card — like the Daily Tournament hero.
export function DeepCard({ children, style }: GlassCardProps) {
  return (
    <View
      style={[
        {
          borderRadius: radii.xl,
          backgroundColor: '#16140f',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        },
        shadows.cardDeep,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
      />
      {children}
    </View>
  );
}
