// src/components/SectionHeader.js
// Dumb component: RTL section title with optional live dot

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "../theme/colors";

export default function SectionHeader({ title, live = false }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.row}>
        {live && <View style={styles.liveDot} />}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.live,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    textAlign: "right",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});
