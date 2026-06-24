// src/components/HeroCard.js
// Dumb component: large featured match card with gradient overlay
// Props-only. No API calls. No state.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { colors, fonts, radius, spacing } from "../theme/colors";

export default function HeroCard({ card, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <ImageBackground
        source={{ uri: card.image_url }}
        style={styles.image}
        imageStyle={{ borderRadius: radius.xl }}
      >
        {/* Dark gradient overlay */}
        <View style={styles.gradient} />

        {/* Top badge */}
        {card.badge_text && (
          <View
            style={[
              styles.badge,
              { backgroundColor: card.badge_color || colors.live },
            ]}
          >
            {card.badge_text === "LIVE" || card.badge_text === "مباشر" ? (
              <View style={styles.liveDot} />
            ) : null}
            <Text style={styles.badgeText}>{card.badge_text}</Text>
          </View>
        )}

        {/* Bottom info */}
        <View style={styles.info}>
          <Text style={styles.subtitle}>{card.subtitle}</Text>
          <Text style={styles.title}>{card.title}</Text>
          <View style={styles.playRow}>
            <Text style={styles.playHint}>اضغط للمشاهدة</Text>
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    overflow: "hidden",
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  image: {
    height: 200,
    justifyContent: "space-between",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.xl,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    margin: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  info: {
    padding: spacing.lg,
    alignItems: "flex-end",
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: "right",
    marginBottom: 2,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  playRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    color: colors.white,
    fontSize: 13,
    marginLeft: 2,
  },
  playHint: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
