import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { useFinanceStore } from './store';
import { isNotVerifiedError } from './api';
import FinanceSheet from './components/FinanceSheet';

// Blocks "save prediction" for unverified accounts and opens the verification flow.
//
//   const { guard, handleSaveError, gateElement } = usePredictionGate(user.id);
//   <Button onPress={() => guard(savePrediction)} />      // pre-check
//   if (error && handleSaveError(error)) return;          // server fallback ("not_verified")
//   ...and render {gateElement} once in the screen.
export function usePredictionGate(userId) {
  const account = useFinanceStore((st) => st.account);
  const loadAccount = useFinanceStore((st) => st.loadAccount);
  const [open, setOpen] = useState(false);
  const pending = useRef(null);

  useEffect(() => { if (userId && !account) loadAccount(userId); }, [userId]);

  const guard = useCallback(
    async (action) => {
      const acc = account ?? (await loadAccount(userId));
      if (acc && acc.can_predict === false) {
        pending.current = action;
        setOpen(true);
        return false;
      }
      await action();
      return true;
    },
    [account, userId]
  );

  const handleSaveError = useCallback((err) => {
    if (isNotVerifiedError(err)) {
      setOpen(true);
      return true;
    }
    return false;
  }, []);

  const gateElement = createElement(FinanceSheet, {
    visible: open,
    userId,
    mode: 'gate',
    onClose: () => {
      setOpen(false);
      pending.current = null;
    },
    onVerified: async () => {
      setOpen(false);
      const action = pending.current;
      pending.current = null;
      if (action) await action(); // continue the save the user was trying to make
    },
  });

  return { guard, handleSaveError, gateElement, canPredict: account?.can_predict !== false };
}
