import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

export function Btn({ title, onPress, loading, disabled, variant = 'primary', style }) {
  const bg = variant === 'primary' ? COLORS.accent : COLORS.card2;
  const color = variant === 'primary' ? COLORS.accentText : COLORS.text;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: off ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={color} /> : <Text style={[s.text, { color }]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  text: { fontSize: 16, fontWeight: '700' },
});
