import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURRENCY, RADIUS, SPACING } from '../theme';
import { fs } from '../strings';
import { useFinanceStore } from '../store';
import { formatMoney } from '../format';
import { StarBadge } from './StarBadge';
import FinanceSheet from './FinanceSheet';

// The 4th main box. Square, shows the balance, opens the pop-up on tap.
// Pass `style` to match the size/spacing of your other three boxes.
export default function FinanceBox({ userId, style }) {
  const account = useFinanceStore((st) => st.account);
  const loadAccount = useFinanceStore((st) => st.loadAccount);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (userId) loadAccount(userId); }, [userId]);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [s.box, style, pressed && { opacity: 0.9 }]}>
        <View style={s.top}>
          <Ionicons name="wallet" size={22} color={COLORS.accent} />
          <StarBadge badge={account?.badge} size={18} />
        </View>
        <View>
          <Text style={s.title}>{fs.box.title}</Text>
          <Text style={s.balance} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(account?.balance ?? 0)}
          </Text>
          <Text style={s.cur}>{CURRENCY}</Text>
        </View>
      </Pressable>

      <FinanceSheet visible={open} userId={userId} mode="account" onClose={() => setOpen(false)} />
    </>
  );
}

const s = StyleSheet.create({
  box: {
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: COLORS.muted, fontSize: 13, textAlign: 'right' },
  balance: { color: COLORS.accent, fontSize: 26, fontWeight: '900', textAlign: 'right' },
  cur: { color: COLORS.muted, fontSize: 12, textAlign: 'right' },
});
