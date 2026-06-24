// src/components/ChannelListItem.js
// Dumb component: single row in mini player's channel list

import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/colors";

export default function ChannelListItem({ channel, isActive, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, isActive && styles.activeContainer]}
    >
      {/* Logo */}
      <View style={styles.logoWrap}>
        {channel.logo_url ? (
          <Image
            source={{ uri: channel.logo_url }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.logo, { backgroundColor: colors.secondary }]}>
            <Text style={{ fontSize: 18 }}>📺</Text>
          </View>
        )}
        {channel.is_live && <View style={styles.liveDot} />}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
          {channel.name}
        </Text>
        <Text style={styles.category}>{channel.category}</Text>
      </View>

      {/* Active indicator */}
      {isActive && <View style={styles.activeBar} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.md,
    backgroundColor: "transparent",
  },
  activeContainer: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  logoWrap: {
    position: "relative",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  liveDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.live,
    borderWidth: 2,
    borderColor: colors.background,
  },
  info: {
    flex: 1,
    alignItems: "flex-end",
  },
  name: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "right",
  },
  activeName: {
    color: colors.primary,
  },
  category: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "right",
  },
  activeBar: {
    width: 3,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
});
