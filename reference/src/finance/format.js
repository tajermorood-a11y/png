export function formatMoney(n) {
  const v = Math.trunc(Number(n) || 0);
  return (v < 0 ? '-' : '') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const pad = (x) => String(x).padStart(2, '0');

export function formatDateTime(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return '';
  let h = d.getHours();
  const suffix = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}  ${h}:${pad(d.getMinutes())} ${suffix}`;
}

export const formatDay = (s) => (s ? String(s).slice(0, 10).replace(/-/g, '/') : '');

// "1234 5678 9012" display for a digit string
export const groupCode = (digits) => (digits.match(/.{1,4}/g) ?? []).join(' ');

// Same rounding as the server (half up): points = round(base * odds)
export function pointsWithOdds(base, odds) {
  const cents = Math.round(Number(odds || 1) * 100);
  return Math.floor((base * cents + 50) / 100);
}
