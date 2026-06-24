// src/screens/HomeScreen.js
// Smart screen: fetches SDUI layout from Supabase, renders via switch
// Reads click_action from each card → navigates to correct screen

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  ScrollView,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSduiLayout } from "../api/sduiApi";
import HeroCard from "../components/HeroCard";
import MatchCard from "../components/MatchCard";
import ChannelCard from "../components/ChannelCard";
import SectionHeader from "../components/SectionHeader";
import { colors, fonts, spacing } from "../theme/colors";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [layout, setLayout]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Data Load ─────────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await fetchSduiLayout();
      setLayout(data);
    } catch (e) {
      Alert.alert("خطأ", "تعذّر التحميل. تحقق من اتصالك وحاول مجدداً.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Navigation Handler (reads click_action from server) ───
  const handleCardPress = (card) => {
    const payload = card.action_payload || {};
    switch (card.click_action) {
      case "NAVIGATE_TO_FULL_PLAYER":
        navigation.navigate("FullPlayer", {
          streamUrl: payload.stream_url,
          title: payload.title,
          channelName: payload.channel_name,
          thumbnailUrl: payload.thumbnail_url,
        });
        break;
      case "NAVIGATE_TO_MINI_PLAYER":
        navigation.navigate("MiniPlayer", {
          streamUrl: payload.stream_url,
          title: payload.title,
          channelName: payload.channel_name,
        });
        break;
      default:
        break;
    }
  };

  // ── Build Typed Items Array ────────────────────────────────
  const buildItems = () => {
    const items = [];
    const heroes       = layout.filter(c => c.card_type === "hero");
    const matchCards   = layout.filter(c => c.card_type === "match_card");
    const channelCards = layout.filter(c => c.card_type === "channel_card");

    // Header
    items.push({ key: "header", type: "app-header" });

    // Hero section
    if (heroes.length > 0) {
      heroes.forEach(c =>
        items.push({ key: `hero-${c.id}`, type: "hero", card: c })
      );
    }

    // Match cards section
    if (matchCards.length > 0) {
      items.push({ key: "match-hdr", type: "section-header", title: "المباريات", live: true });
      matchCards.forEach(c =>
        items.push({ key: `match-${c.id}`, type: "match_card", card: c })
      );
    }

    // Channel cards section (horizontal scroll)
    if (channelCards.length > 0) {
      items.push({ key: "ch-hdr", type: "section-header", title: "القنوات" });
      items.push({ key: "channels-row", type: "channels-row", cards: channelCards });
    }

    return items;
  };

  // ── Render Each Item Type ──────────────────────────────────
  const renderItem = ({ item }) => {
    switch (item.type) {
      case "app-header":
        return (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>ملعبنا 🏟️</Text>
            <Text style={styles.headerSub}>مباشر على مدار الساعة</Text>
          </View>
        );

      case "hero":
        return (
          <HeroCard
            card={item.card}
            onPress={() => handleCardPress(item.card)}
          />
        );

      case "section-header":
        return <SectionHeader title={item.title} live={item.live} />;

      case "match_card":
        return (
          <MatchCard
            card={item.card}
            onPress={() => handleCardPress(item.card)}
          />
        );

      case "channels-row":
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.channelsRow}
          >
            {item.cards.map(c => (
              <ChannelCard
                key={c.id}
                card={c}
                onPress={() => handleCardPress(c)}
              />
            ))}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // ── Main Render ────────────────────────────────────────────
  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <FlatList
        data={buildItems()}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={<View style={{ height: insets.bottom + 16 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: "flex-end",
  },
  headerTitle: {
    color: colors.foreground,
    fontFamily: fonts.black,
    fontSize: 28,
    textAlign: "right",
  },
  headerSub: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: "right",
  },
  channelsRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
  },
});
