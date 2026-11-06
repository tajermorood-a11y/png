import { I18nManager } from 'react-native';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const APP_NAME = 'فانتوم';
export const CURRENCY = 'د.ع';
export const MAX_GOALS = 20;

export const COLORS = {
  bg: '#0E0B1C',
  card: '#181330',
  card2: '#241D44',
  border: '#3A2F66',
  text: '#F1ECFF',
  muted: '#9D93C4',
  accent: '#F2C14E',
  accentText: '#2A1E00',
  credit: '#3DDC97',
  debit: '#FF6B8B',
  info: '#8AB4FF',
};
export const STAR_COLORS = { red: '#FF4D4F', green: '#2ECC71', yellow: '#FFC531' };
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const RADIUS = { sm: 8, md: 12, lg: 18, pill: 999 };

// Layout helpers that look right whether or not the OS is already in native RTL mode.
export const RTL = {
  row: I18nManager.isRTL ? 'row' : 'row-reverse',
  start: I18nManager.isRTL ? 'flex-start' : 'flex-end',
  align: 'right',
};

// Avatars are emoji (no image assets needed). Option id -> emoji.
export const AVATAR_EMOJIS = ['⚽', '🏆', '🦁', '🦅', '🐺', '🔥', '⭐', '🎯', '🦊', '🐯', '🏟️', '👑'];
