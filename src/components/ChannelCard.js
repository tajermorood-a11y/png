// src/components/ChannelCard.js
// Dumb component: compact channel card (SDUI type: channel_card)

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { colors, fonts, radius, spacing } from "../theme/colors";

export default function ChannelCard({ card, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
    >
      {/* Logo */}
      <View style={styles.logoWrap}>
        {card.image_url ? (
          <Image
            source={{ uri: card.image_url }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.logo, { backgroundColor: colors.secondary }]}>
            <Text style={styles.logoFallback}>📺</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>{card.title}</Text>
      <Text style={styles.sub} numberOfLines={1}>{card.subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 110,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  logoWrap: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  logoFallback: {
    fontSize: 24,
  },
  name: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  sub: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 10,
    textAlign: "center",
  },
});
