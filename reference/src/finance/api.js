import { supabase } from './supabaseClient';
import { fs } from './strings';

function mapError(e) {
  const msg = String(e?.message ?? e ?? '');
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) return fs.errors.offline;
  return fs.errors.generic;
}

// Always { data, error }; never throws. `error` is a ready-to-show Arabic message.
async function run(fn) {
  try {
    const { data, error } = await fn();
    if (error) return { data: null, error: mapError(error) };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: mapError(e) };
  }
}

export const getAccount = (userId) => run(() => supabase.rpc('get_account', { p_user_id: userId }));
export const getPointsHistory = (userId) => run(() => supabase.rpc('get_points_history', { p_user_id: userId }));
export const getWalletHistory = (userId, limit = 50) =>
  run(() => supabase.rpc('get_wallet_history', { p_user_id: userId, p_limit: limit }));
export const getBadges = () => run(() => supabase.rpc('get_badges'));
export const setBadge = (userId, badge) => run(() => supabase.rpc('set_badge', { p_user_id: userId, p_badge: badge }));

// -> { ok: true, amount, balance, verified, badge } | { ok: false, error: 'invalid_code' | 'too_many_attempts' | ... }
export const redeemCode = (userId, code, referral) =>
  run(() =>
    supabase.rpc('redeem_topup_code', { p_user_id: userId, p_code: code, p_referral: referral?.trim() || null })
  );

// Use on the RAW error returned by your own "save prediction" call.
export const isNotVerifiedError = (err) => String(err?.message ?? err ?? '').includes('not_verified');
