import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, RTL, SPACING } from '../theme';
import { fs } from '../strings';
import { pointsWithOdds } from '../format';

// Small pill for match cards: ×1.35
export function OddsBadge({ odds, style }) {
  return (
    <View style={[s.pill, style]}>
      <Text style={s.label}>{fs.odds.label}</Text>
      <Text style={s.value}>×{Number(odds ?? 1).toFixed(2)}</Text>
    </View>
  );
}

// For the confirm step: what each outcome is worth with this match's odds.
export function ExpectedPoints({ odds }) {
  const rows = [
    { label: fs.odds.exact, base: 25, color: COLORS.credit },
    { label: fs.odds.outcome, base: 5, color: COLORS.info },
    { label: fs.odds.wrong, base: 1, color: COLORS.muted },
  ];
  return (
    <View style={s.box}>
      <Text style={s.title}>{fs.odds.expected}  ×{Number(odds ?? 1).toFixed(2)}</Text>
      {rows.map((r) => (
        <View key={r.base} style={s.row}>
          <Text style={s.rowLabel}>{r.label}</Text>
          <Text style={[s.rowValue, { color: r.color }]}>{pointsWithOdds(r.base, odds)}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: RTL.row,
    alignItems: 'center',
    alignSelf: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card2,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  label: { color: COLORS.muted, fontSize: 12 },
  value: { color: COLORS.accent, fontSize: 15, fontWeight: '900' },
  box: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  row: { flexDirection: RTL.row, justifyContent: 'space-between' },
  rowLabel: { color: COLORS.muted, fontSize: 13 },
  rowValue: { fontSize: 15, fontWeight: '800' },
});
