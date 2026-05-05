import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontWeight, shadows } from '@/lib/design/tokens';

type Variant = 'primary' | 'cobalt' | 'ink' | 'plain';

interface TactileButtonProps {
  children: string;
  onPress?: () => void;
  variant?: Variant;
  testID?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function TactileButton({
  children,
  onPress,
  variant = 'primary',
  testID,
  accessibilityLabel,
  style,
  fullWidth = true,
}: TactileButtonProps) {
  const labelColor =
    variant === 'plain' ? colors.ink : colors.paper;

  const inner = (
    <Text
      style={{
        fontSize: 16,
        fontWeight: fontWeight.bold,
        letterSpacing: -0.2,
        color: labelColor,
      }}
    >
      {children}
    </Text>
  );

  const baseStyle: ViewStyle = {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    width: fullWidth ? '100%' : undefined,
  };

  if (variant === 'primary') {
    return (
      <Pressable
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          shadows.buttonEmber,
          { transform: [{ translateY: pressed ? 1 : 0 }], overflow: 'hidden' },
          style,
        ]}
      >
        <LinearGradient
          colors={['#ff8e72', colors.ember, colors.emberDeep]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.5)',
          }}
        />
        {inner}
      </Pressable>
    );
  }

  if (variant === 'cobalt') {
    return (
      <Pressable
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          { transform: [{ translateY: pressed ? 1 : 0 }], overflow: 'hidden' },
          style,
        ]}
      >
        <LinearGradient
          colors={['#5d77e8', colors.cobalt, colors.cobaltDeep]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {inner}
      </Pressable>
    );
  }

  if (variant === 'ink') {
    return (
      <Pressable
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          { backgroundColor: colors.ink, transform: [{ translateY: pressed ? 1 : 0 }] },
          style,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        baseStyle,
        {
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: 'rgba(22,20,15,0.1)',
          transform: [{ translateY: pressed ? 1 : 0 }],
        },
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}
