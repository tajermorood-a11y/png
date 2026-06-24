// src/screens/MiniPlayerScreen.js
// Screen 3: Mini player + channel playlist
// Fix 1: useSafeAreaInsets (no clipping)
// Fix 2: Same custom HTML player (consistent UI)
// Fix 3: Landscape support — player expands to full screen

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as ScreenOrientation from "expo-screen-orientation";
import { fetchChannels } from "../api/channelsApi";
import ChannelListItem from "../components/ChannelListItem";
import { colors, fonts, spacing, radius } from "../theme/colors";

// ── Custom player HTML (same as FullPlayer for consistency) ───
const buildPlayerHTML = (streamUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
    video { width: 100%; height: 100%; object-fit: contain; display: block; }
    #controls { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 8px; background: linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%); opacity: 1; transition: opacity 0.3s; }
    #controls.hidden { opacity: 0; pointer-events: none; }
    #progress-wrap { width: 100%; height: 3px; background: rgba(255,255,255,0.25); border-radius: 99px; margin-bottom: 8px; cursor: pointer; position: relative; }
    #progress-fill { height: 100%; background: #3B82F6; border-radius: 99px; width: 0%; }
    #bottom-row { display: flex; align-items: center; gap: 8px; }
    button { background: none; border: none; cursor: pointer; padding: 3px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    button:active { background: rgba(255,255,255,0.1); }
    svg { display: block; }
    #live-badge { background: #EF4444; color: #fff; font-size: 10px; font-weight: bold; font-family: sans-serif; padding: 2px 6px; border-radius: 99px; display: flex; align-items: center; gap: 3px; }
    .live-dot { width: 5px; height: 5px; background: #fff; border-radius: 50%; animation: blink 1.2s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    #buffering { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; }
    #buffering.show { display: flex; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #time-display { color: rgba(255,255,255,0.7); font-family: monospace; font-size: 10px; flex: 1; }
  </style>
</head>
<body>
<div id="container">
  <video id="video" playsinline></video>
  <div id="buffering"><div class="spinner"></div></div>
  <div id="controls">
    <div id="progress-wrap" onclick="seekTo(event)">
      <div id="progress-fill"></div>
    </div>
    <div id="bottom-row">
      <button id="playbtn" onclick="togglePlay()">
        <svg id="play-icon" width="20" height="20" fill="white" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
        <svg id="pause-icon" width="20" height="20" fill="white" viewBox="0 0 24 24" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      </button>
      <button onclick="toggleMute()">
        <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
      <span id="time-display">LIVE</span>
      <div id="live-badge"><div class="live-dot"></div>LIVE</div>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"></script>
<script>
  const video = document.getElementById('video');
  const controls = document.getElementById('controls');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const fill = document.getElementById('progress-fill');
  const bufWrap = document.getElementById('buffering');
  let hls, hideTimer, isMuted = false;

  function initHls() {
    const src = "${streamUrl}";
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: false });
      hls.loadSource(src); hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}));
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) hls.recoverMediaError(); });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src; video.play().catch(()=>{});
    }
  }

  function resetHide() {
    controls.classList.remove('hidden');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!video.paused) controls.classList.add('hidden'); }, 3000);
  }
  document.getElementById('container').addEventListener('touchstart', resetHide);

  function togglePlay() {
    if (video.paused) video.play(); else video.pause();
    resetHide();
  }
  video.addEventListener('play', () => { playIcon.style.display='none'; pauseIcon.style.display='block'; });
  video.addEventListener('pause', () => { playIcon.style.display='block'; pauseIcon.style.display='none'; controls.classList.remove('hidden'); });

  video.addEventListener('timeupdate', () => {
    if (!video.duration || !isFinite(video.duration)) return;
    fill.style.width = (video.currentTime / video.duration * 100) + '%';
  });
  function seekTo(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (video.duration && isFinite(video.duration)) video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
    resetHide();
  }
  function toggleMute() { isMuted = !isMuted; video.muted = isMuted; }
  video.addEventListener('waiting', () => bufWrap.classList.add('show'));
  video.addEventListener('playing', () => bufWrap.classList.remove('show'));
  video.addEventListener('loadedmetadata', () => {
    if (!isFinite(video.duration) || video.duration > 86400) {
      document.getElementById('progress-wrap').style.display='none';
    }
  });
  initHls(); resetHide();
</script>
</body>
</html>
`;

export default function MiniPlayerScreen({ navigation, route }) {
  const {
    streamUrl: initialStreamUrl,
    title: initialTitle,
    channelName: initialChannelName,
  } = route.params || {};

  const insets = useSafeAreaInsets();

  const [currentStream, setCurrentStream]   = useState(initialStreamUrl);
  const [currentTitle, setCurrentTitle]     = useState(initialTitle);
  const [currentChannel, setCurrentChannel] = useState(initialChannelName);
  const [activeId, setActiveId]             = useState(null);
  const [channels, setChannels]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [playerLoading, setPlayerLoading]   = useState(true);
  const [isLandscape, setIsLandscape]       = useState(false);

  // ── Orientation ────────────────────────────────────────────
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    const sub = ScreenOrientation.addOrientationChangeListener((evt) => {
      const ori = evt.orientationInfo.orientation;
      setIsLandscape(
        ori === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        ori === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    });
    return () => {
      ScreenOrientation.removeOrientationChangeListener(sub);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
  };

  // ── Load channels ─────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await fetchChannels();
      setChannels(data);
    } catch (e) {
      Alert.alert("خطأ", "تعذّر تحميل القنوات.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChannelSelect = (channel) => {
    setCurrentStream(channel.stream_url);
    setCurrentTitle(channel.name);
    setCurrentChannel(channel.category);
    setActiveId(channel.id);
    setPlayerLoading(true);
  };

  const renderChannel = ({ item }) => (
    <ChannelListItem
      channel={item}
      isActive={item.id === activeId}
      onPress={() => handleChannelSelect(item)}
    />
  );

  // ── Landscape: full screen player only ────────────────────
  if (isLandscape) {
    return (
      <View style={styles.fullBlack}>
        <WebView
          key={currentStream}
          source={{ html: buildPlayerHTML(currentStream) }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => setPlayerLoading(false)}
          scrollEnabled={false}
        />
        {playerLoading && (
          <View style={styles.absoluteCenter}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        <TouchableOpacity
          style={[styles.floatBtn, { top: 16, right: 16 }]}
          onPress={toggleOrientation}
        >
          <Text style={styles.floatIcon}>⤢</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatBtn, { top: 16, left: 16 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.floatIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Portrait: mini player + list ─────────────────────────
  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Mini Player Block */}
      <View style={styles.miniBlock}>
        {/* Header */}
        <View style={styles.miniHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.miniInfo}>
            <Text style={styles.miniTitle} numberOfLines={1}>{currentTitle}</Text>
            <Text style={styles.miniChannel}>{currentChannel}</Text>
          </View>
          <TouchableOpacity onPress={toggleOrientation} style={styles.iconBtn}>
            <Text style={styles.iconText}>⛶</Text>
          </TouchableOpacity>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Player */}
        <View style={styles.playerBox}>
          {playerLoading && (
            <View style={styles.absoluteCenter}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
          <WebView
            key={currentStream}
            source={{ html: buildPlayerHTML(currentStream) }}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoad={() => setPlayerLoading(false)}
            scrollEnabled={false}
          />
        </View>
      </View>

      {/* Channel List */}
      <View style={styles.listWrap}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>القنوات المتاحة</Text>
          <Text style={styles.listCount}>{channels.length} قناة</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={channels}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderChannel}
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullBlack: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  miniBlock: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  miniHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: colors.foreground,
    fontSize: 15,
  },
  miniInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  miniTitle: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: "right",
  },
  miniChannel: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "right",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontFamily: fonts.bold, fontSize: 10 },
  playerBox: {
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  absoluteCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 10,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  listWrap: { flex: 1 },
  listHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    textAlign: "right",
  },
  listCount: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  floatBtn: {
    position: "absolute",
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  floatIcon: { color: "#fff", fontSize: 16 },
});
