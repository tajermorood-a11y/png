import { t } from '../constants/strings';

const MAP = {
  match_locked: t.errors.match_locked,
  not_verified: t.errors.not_verified,
  friend_not_found: t.errors.friend_not_found,
  friend_self: t.errors.friend_self,
  'duplicate key': t.errors.duplicate,
  'Network request failed': t.errors.offline,
  'Failed to fetch': t.errors.offline,
};

export function mapError(e) {
  const msg = String(e?.message ?? e ?? '');
  for (const k of Object.keys(MAP)) if (msg.includes(k)) return MAP[k];
  return t.errors.generic;
}
