import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, RTL, SPACING, STAR_COLORS } from '../theme';
import { fs } from '../strings';
import { setBadge } from '../api';
import { useFinanceStore } from '../store';
import { Btn } from './Btn';

const OPTIONS = ['red', 'green', 'yellow'];

export default function BadgePicker({ userId, onDone, allowSkip }) {
  const current = useFinanceStore((st) => st.account?.badge);
  const applyBadge = useFinanceStore((st) => st.applyBadge);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  const pick = async (badge) => {
    setSaving(badge);
    setError('');
    const { data, error: err } = await setBadge(userId, badge);
    setSaving(null);
    if (err) return setError(err);
    if (!data?.ok) return setError(fs.errors.generic);
    applyBadge(userId, badge);
    onDone?.();
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{fs.badge.title}</Text>
      <Text style={s.hint}>{fs.badge.hint}</Text>
      <View style={s.row}>
        {OPTIONS.map((b) => (
          <Pressable
            key={b}
            onPress={() => pick(b)}
            disabled={!!saving}
            style={[s.option, current === b && { borderColor: STAR_COLORS[b] }, saving === b && { opacity: 0.6 }]}
          >
            <Ionicons name="star" size={40} color={STAR_COLORS[b]} />
            <Text style={s.label}>{fs.badge[b]}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {allowSkip ? <Btn title={fs.common.later} variant="ghost" onPress={onDone} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: SPACING.lg, padding: SPACING.xl },
  title: { color: COLORS.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  hint: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  row: { flexDirection: RTL.row, gap: SPACING.md },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card2,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  error: { color: COLORS.debit, fontSize: 14, textAlign: 'center' },
});
