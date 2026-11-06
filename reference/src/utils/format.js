export const formatDay = (s) => (s ? String(s).slice(0, 10).replace(/-/g, '/') : '');

export const isMatchOpen = (m) =>
  m?.status === 'upcoming' && (!m.lock_time || new Date(m.lock_time) > new Date());
