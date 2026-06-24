// src/theme/colors.js
// ملعبنا - Design Tokens
// Single source of truth. Never hardcode values anywhere else.

export const colors = {
  background:      "#0A0E14", // deep stadium night
  card:            "#131820", // surface / card
  secondary:       "#1C2333", // hover / muted surface
  border:          "#252D3D", // dividers, strokes
  foreground:      "#F0F4FF", // primary text
  mutedForeground: "#6B7A99", // secondary text
  primary:         "#3B82F6", // brand blue (football kit blue)
  primaryLight:    "#3B82F620", // brand at ~12% opacity
  accent:          "#10B981", // live green
  accentLight:     "#10B98120",
  live:            "#EF4444", // live / danger red
  liveLight:       "#EF444420",
  gold:            "#F59E0B", // featured / star
  white:           "#FFFFFF",
  overlay:         "rgba(0,0,0,0.6)",
};

export const fonts = {
  light:     "Tajawal_300Light",
  regular:   "Tajawal_400Regular",
  medium:    "Tajawal_500Medium",
  bold:      "Tajawal_700Bold",
  extraBold: "Tajawal_800ExtraBold",
  black:     "Tajawal_900Black",
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
