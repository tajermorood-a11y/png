import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { COLORS, CURRENCY, RADIUS, RTL, SPACING } from '../theme';
import { fs } from '../strings';
import { getWalletHistory } from '../api';
import { formatDateTime, formatMoney } from '../format';
import { Btn } from './Btn';

export default function WalletHistory({ userId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const { data, error: err } = await getWalletHistory(userId, 100);
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
      keyExtractor={(r) => String(r.id)}
      ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
      ListEmptyComponent={<Text style={s.muted}>{fs.sheet.emptyWallet}</Text>}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
      renderItem={({ item: r }) => {
        const credit = r.direction === 'credit';
        return (
          <View style={s.card}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.title}>{r.description || fs.sheet.topupRow}</Text>
              <Text style={s.meta}>{formatDateTime(r.created_at)}  ·  {formatMoney(r.balance_after)} {CURRENCY}</Text>
            </View>
            <Text style={[s.amount, { color: credit ? COLORS.credit : COLORS.debit }]}>
              {credit ? '+' : '-'}{formatMoney(r.amount)}
            </Text>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', gap: SPACING.md, padding: SPACING.xl },
  muted: { color: COLORS.muted, textAlign: 'center', padding: SPACING.xl },
  error: { color: COLORS.debit, textAlign: 'center' },
  card: { flexDirection: RTL.row, alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.card2, borderRadius: RADIUS.md, padding: SPACING.md },
  title: { color: COLORS.text, fontSize: 14, fontWeight: '700', textAlign: RTL.align },
  meta: { color: COLORS.muted, fontSize: 11, textAlign: RTL.align },
  amount: { fontSize: 16, fontWeight: '800' },
});
