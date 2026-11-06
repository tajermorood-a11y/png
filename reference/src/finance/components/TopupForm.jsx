import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS, CURRENCY, RADIUS, SPACING } from '../theme';
import { fs } from '../strings';
import { redeemCode } from '../api';
import { useFinanceStore } from '../store';
import { formatMoney, groupCode } from '../format';
import { Btn } from './Btn';

// 12-digit secret code + optional referral. Verifies the account on success.
export default function TopupForm({ userId, onSuccess }) {
  const applyRedeem = useFinanceStore((st) => st.applyRedeem);
  const [digits, setDigits] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(null);

  const submit = async () => {
    if (digits.length !== 12 || loading) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await redeemCode(userId, digits, referral);
    setLoading(false);
    if (err) return setError(err);
    if (!data?.ok) return setError(fs.topup.errors[data?.error] ?? fs.errors.generic);
    applyRedeem(data);
    setAdded(data.amount);
    setTimeout(() => onSuccess?.(data), 1300);
  };

  if (added != null) {
    return (
      <View style={s.wrap}>
        <Text style={s.success}>{fs.topup.success(formatMoney(added), CURRENCY)}</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>{fs.topup.title}</Text>

      <Text style={s.label}>{fs.topup.codeLabel}</Text>
      <TextInput
        value={groupCode(digits)}
        onChangeText={(v) => setDigits(v.replace(/\D/g, '').slice(0, 12))}
        placeholder={fs.topup.codePlaceholder}
        placeholderTextColor={COLORS.muted}
        keyboardType="number-pad"
        maxLength={14}
        autoFocus
        style={[s.input, s.code]}
      />

      <Text style={s.label}>{fs.topup.referralLabel}</Text>
      <TextInput
        value={referral}
        onChangeText={setReferral}
        placeholder="—"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={32}
        style={s.input}
      />

      {error ? <Text style={s.error}>{error}</Text> : null}
      <Btn title={fs.topup.submit} onPress={submit} loading={loading} disabled={digits.length !== 12} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: SPACING.md, padding: SPACING.xl },
  title: { color: COLORS.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  label: { color: COLORS.muted, fontSize: 13, textAlign: 'right' },
  input: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    textAlign: 'right',
  },
  code: { fontSize: 22, letterSpacing: 3, textAlign: 'center', fontWeight: '700' },
  error: { color: COLORS.debit, fontSize: 14, textAlign: 'center' },
  success: { color: COLORS.credit, fontSize: 18, fontWeight: '800', textAlign: 'center', paddingVertical: SPACING.xl },
});
