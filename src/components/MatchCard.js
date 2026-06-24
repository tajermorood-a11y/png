// src/components/MatchCard.js
// Dumb component: horizontal match card (SDUI type: match_card)

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { colors, fonts, radius, spacing } from "../theme/colors";

export default function MatchCard({ card, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        {card.image_url ? (
          <Image
            source={{ uri: card.image_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: colors.secondary }]} />
        )}
        {/* Play overlay */}
        <View style={styles.playOverlay}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        {card.badge_text && (
          <View
            style={[
              styles.badge,
              { backgroundColor: card.badge_color || colors.live },
            ]}
          >
            <Text style={styles.badgeText}>{card.badge_text}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{card.title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{card.subtitle}</Text>
      </View>

      {/* Arrow RTL */}
      <Text style={styles.arrow}>‹</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailWrap: {
    position: "relative",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  thumbnail: {
    width: 90,
    height: 60,
    borderRadius: radius.md,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  playIcon: {
    color: colors.white,
    fontSize: 16,
  },
  info: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: "flex-end",
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "right",
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "right",
  },
  arrow: {
    color: colors.mutedForeground,
    fontSize: 22,
    paddingRight: spacing.xs,
  },
});
