import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, RTL, SPACING } from '../theme';
import { fs } from '../strings';
import { getPointsHistory } from '../api';
import { formatDay } from '../format';
import { Btn } from './Btn';

// Per-match points with a running (cumulative) total, newest first.
export default function PointsHistory({ userId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: err } = await getPointsHistory(userId);
    if (err) setError(err);
    else setRows(data);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>{error}</Text>
        <Btn title={fs.common.retry} variant="ghost" onPress={load} />
      </View>
    );
  }
  if (!rows) return <Text style={s.muted}>{fs.common.loading}</Text>;

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => String(r.match_id)}
      ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
      ListEmptyComponent={<Text style={s.muted}>{fs.sheet.emptyPoints}</Text>}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
      renderItem={({ item: r }) => (
        <View style={s.card}>
          <View style={s.top}>
            <Text style={s.teams} numberOfLines={1}>{r.home_team} — {r.away_team}</Text>
            <Text style={s.date}>{formatDay(r.match_date)}</Text>
          </View>
          <View style={s.line}>
            <Text style={s.label}>{fs.sheet.myPrediction}: {r.predicted_home} - {r.predicted_away}</Text>
            <Text style={s.label}>
              {fs.sheet.finalScore}: {r.final_home == null ? fs.sheet.notFinished : `${r.final_home} - ${r.final_away}`}
            </Text>
          </View>
          <View style={s.line}>
            <Text style={s.odds}>×{Number(r.odds).toFixed(2)}</Text>
            <Text style={[s.points, r.points_earned == null && { color: COLORS.muted }]}>
              {fs.sheet.points}: {r.points_earned ?? '—'}
            </Text>
            <Text style={s.running}>{fs.sheet.running}: {r.running_total}</Text>
          </View>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', gap: SPACING.md, padding: SPACING.xl },
  muted: { color: COLORS.muted, textAlign: 'center', padding: SPACING.xl },
  error: { color: COLORS.debit, textAlign: 'center' },
  card: { backgroundColor: COLORS.card2, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  top: { flexDirection: RTL.row, justifyContent: 'space-between', gap: SPACING.sm },
  teams: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '800', textAlign: RTL.align },
  date: { color: COLORS.muted, fontSize: 11 },
  line: { flexDirection: RTL.row, justifyContent: 'space-between', alignItems: 'center' },
  label: { color: COLORS.muted, fontSize: 12 },
  odds: { color: COLORS.accent, fontSize: 13, fontWeight: '800' },
  points: { color: COLORS.credit, fontSize: 14, fontWeight: '800' },
  running: { color: COLORS.info, fontSize: 12, fontWeight: '700' },
});
