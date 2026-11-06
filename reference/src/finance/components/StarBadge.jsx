import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RTL, SPACING, STAR_COLORS } from '../theme';

// A colored star for a user's badge. Renders nothing if there is no badge.
export function StarBadge({ badge, size = 16 }) {
  if (!badge || !STAR_COLORS[badge]) return null;
  return <Ionicons name="star" size={size} color={STAR_COLORS[badge]} />;
}

// Convenience for leaderboard / competition rows: name + star.
export function NameWithBadge({ name, badge, textStyle, size = 16 }) {
  return (
    <View style={s.row}>
      <Text style={textStyle} numberOfLines={1}>{name}</Text>
      <StarBadge badge={badge} size={size} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: RTL.row, alignItems: 'center', gap: SPACING.xs + 2, flexShrink: 1 },
});
