import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, CURRENCY, RADIUS, RTL, SPACING } from '../theme';
import { fs } from '../strings';
import { useFinanceStore } from '../store';
import { formatMoney } from '../format';
import { Btn } from './Btn';
import { StarBadge } from './StarBadge';
import TopupForm from './TopupForm';
import BadgePicker from './BadgePicker';
import PointsHistory from './PointsHistory';
import WalletHistory from './WalletHistory';

// One modal, several views (avoids nested modals):
//   account -> main pop-up (balance + points/wallet history + top-up + star)
//   gate    -> "verify to save predictions" explanation -> topup -> badge
export default function FinanceSheet({ visible, userId, mode = 'account', onClose, onVerified }) {
  const base = mode === 'gate' ? 'gate' : 'account';
  const [view, setView] = useState(base);
  const [tab, setTab] = useState('points');
  const account = useFinanceStore((st) => st.account);
  const loadAccount = useFinanceStore((st) => st.loadAccount);

  useEffect(() => {
    if (visible) {
      setView(base);
      setTab('points');
      if (userId) loadAccount(userId);
    }
  }, [visible, base, userId]);

  const back = () => (view === 'topup' || view === 'badge' ? setView(base) : onClose?.());
  const finish = () => (mode === 'gate' ? onVerified?.() : setView('account'));
  const afterTopup = (res) => (res.badge ? finish() : setView('badge'));

  const tall = view === 'account';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={back}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, tall && { height: '88%' }]}>
          <View style={s.grab} />

          {view === 'gate' && (
            <View style={s.gate}>
              <Text style={s.gateTitle}>{fs.gate.title}</Text>
              <Text style={s.gateBody}>{fs.gate.body}</Text>
              <Btn title={fs.gate.action} onPress={() => setView('topup')} />
              <Btn title={fs.common.cancel} variant="ghost" onPress={onClose} />
            </View>
          )}

          {view === 'topup' && (
            <>
              <TopupForm userId={userId} onSuccess={afterTopup} />
              <Btn title={fs.common.back} variant="ghost" onPress={back} style={s.backBtn} />
            </>
          )}

          {view === 'badge' && (
            <BadgePicker userId={userId} allowSkip={base === 'gate' || !account?.badge} onDone={finish} />
          )}

          {view === 'account' && (
            <View style={{ flex: 1 }}>
              <View style={s.header}>
                <Text style={s.label}>{fs.sheet.balance}</Text>
                <Text style={s.balance}>
                  {formatMoney(account?.balance ?? 0)} <Text style={s.cur}>{CURRENCY}</Text>
                </Text>
                <View style={s.status}>
                  {account?.verified ? (
                    <>
                      <StarBadge badge={account.badge} size={16} />
                      <Text style={[s.statusText, { color: COLORS.credit }]}>{fs.box.verified}</Text>
                    </>
                  ) : (
                    <Text style={[s.statusText, { color: COLORS.muted }]}>{fs.box.notVerified}</Text>
                  )}
                </View>
                <View style={s.actions}>
                  <Btn title={fs.sheet.topup} onPress={() => setView('topup')} style={{ flex: 1 }} />
                  {account?.verified ? (
                    <Btn title={fs.sheet.pickStar} variant="ghost" onPress={() => setView('badge')} style={{ flex: 1 }} />
                  ) : null}
                </View>
              </View>

              <View style={s.tabs}>
                {[['points', fs.sheet.points], ['wallet', fs.sheet.wallet]].map(([k, label]) => (
                  <Pressable key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]}>
                    <Text style={[s.tabText, tab === k && { color: COLORS.accentText }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flex: 1 }}>
                {tab === 'points' ? <PointsHistory userId={userId} /> : <WalletHistory userId={userId} />}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5,10,20,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg + 6,
    borderTopRightRadius: RADIUS.lg + 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    maxHeight: '92%',
  },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: SPACING.md },
  gate: { gap: SPACING.md, padding: SPACING.lg },
  gateTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  gateBody: { color: COLORS.muted, fontSize: 15, textAlign: 'center', lineHeight: 24 },
  backBtn: { marginHorizontal: SPACING.xl, marginBottom: SPACING.md },
  header: { alignItems: 'center', gap: SPACING.xs + 2, marginBottom: SPACING.md },
  label: { color: COLORS.muted, fontSize: 13 },
  balance: { color: COLORS.accent, fontSize: 36, fontWeight: '900' },
  cur: { fontSize: 15, fontWeight: '600' },
  status: { flexDirection: RTL.row, alignItems: 'center', gap: SPACING.xs + 2 },
  statusText: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: RTL.row, gap: SPACING.sm, alignSelf: 'stretch', marginTop: SPACING.sm },
  tabs: { flexDirection: RTL.row, gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, backgroundColor: COLORS.card2, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm, alignItems: 'center' },
  tabOn: { backgroundColor: COLORS.accent },
  tabText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
});
