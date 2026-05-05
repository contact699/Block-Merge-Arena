import { View, Text, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontWeight } from '@/lib/design/tokens';

type Variant = 'plain' | 'ember' | 'mustard' | 'ink';

interface PillProps {
  children: string;
  variant?: Variant;
  style?: ViewStyle;
}

export function Pill({ children, variant = 'plain', style }: PillProps) {
  const text = (
    <Text
      style={{
        fontSize: 10,
        fontWeight: fontWeight.bold,
        letterSpacing: 1.4,
        color:
          variant === 'ember' || variant === 'ink'
            ? colors.paper
            : colors.ink,
      }}
    >
      {children.toUpperCase()}
    </Text>
  );

  const baseStyle: ViewStyle = {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignSelf: 'flex-start',
  };

  if (variant === 'ember') {
    return (
      <View style={[baseStyle, { overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={['#ff8e72', colors.ember]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {text}
      </View>
    );
  }
  if (variant === 'mustard') {
    return (
      <View style={[baseStyle, { overflow: 'hidden' }, style]}>
        <LinearGradient
          colors={['#ffd97a', colors.mustard]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {text}
      </View>
    );
  }
  if (variant === 'ink') {
    return (
      <View style={[baseStyle, { backgroundColor: colors.ink }, style]}>{text}</View>
    );
  }
  return (
    <View
      style={[
        baseStyle,
        {
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderWidth: 1,
          borderColor: 'rgba(22,20,15,0.08)',
        },
        style,
      ]}
    >
      {text}
    </View>
  );
}
