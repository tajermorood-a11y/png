// src/screens/FullPlayerScreen.js
// Screen 2: Full-screen HLS player — custom controls, landscape support
// Fix 1: useSafeAreaInsets (no clipping)
// Fix 2: Custom HTML player (no native ugly controls)
// Fix 3: expo-screen-orientation — auto landscape + portrait toggle

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as ScreenOrientation from "expo-screen-orientation";
import { colors, fonts, spacing } from "../theme/colors";

// ── Custom HLS Player HTML ────────────────────────────────────
// Uses hls.js + custom styled controls (no native browser controls)
const buildPlayerHTML = (streamUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }

    #container {
      position: relative;
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #000;
    }

    video {
      width: 100%; height: 100%;
      object-fit: contain;
      display: block;
    }

    /* ── Controls overlay ── */
    #controls {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      justify-content: flex-end;
      padding: 12px;
      background: linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%);
      opacity: 1;
      transition: opacity 0.3s;
    }
    #controls.hidden { opacity: 0; pointer-events: none; }

    /* ── Progress bar ── */
    #progress-wrap {
      width: 100%;
      height: 3px;
      background: rgba(255,255,255,0.25);
      border-radius: 99px;
      margin-bottom: 10px;
      cursor: pointer;
      position: relative;
    }
    #progress-fill {
      height: 100%; background: #3B82F6;
      border-radius: 99px;
      width: 0%;
      transition: width 0.3s linear;
    }
    #progress-dot {
      position: absolute;
      top: 50%; transform: translateY(-50%);
      width: 12px; height: 12px;
      background: #fff;
      border-radius: 50%;
      margin-left: -6px;
      left: 0%;
      transition: left 0.3s linear;
    }

    /* ── Bottom row ── */
    #bottom-row {
      display: flex; align-items: center;
      gap: 12px;
    }

    button {
      background: none; border: none;
      cursor: pointer; padding: 4px;
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    button:active { background: rgba(255,255,255,0.1); }

    svg { display: block; }

    #time-display {
      color: rgba(255,255,255,0.8);
      font-family: monospace;
      font-size: 12px;
      flex: 1;
    }

    /* ── Live badge ── */
    #live-badge {
      background: #EF4444;
      color: #fff;
      font-size: 11px;
      font-weight: bold;
      font-family: sans-serif;
      padding: 2px 8px;
      border-radius: 99px;
      display: flex; align-items: center; gap: 4px;
    }
    .live-dot {
      width: 6px; height: 6px;
      background: #fff; border-radius: 50%;
      animation: blink 1.2s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* ── Quality badge ── */
    #quality-badge {
      color: rgba(255,255,255,0.6);
      font-size: 11px;
      font-family: monospace;
    }

    /* ── Volume slider ── */
    #vol-wrap {
      display: flex; align-items: center; gap: 6px;
    }
    input[type=range] {
      -webkit-appearance: none;
      width: 60px; height: 3px;
      background: rgba(255,255,255,0.3);
      border-radius: 99px; outline: none;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px; height: 12px;
      background: #fff; border-radius: 50%;
    }

    /* ── Buffering spinner ── */
    #buffering {
      position: absolute; inset: 0;
      display: none; align-items: center; justify-content: center;
    }
    #buffering.show { display: flex; }
    .spinner {
      width: 48px; height: 48px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
<div id="container">
  <video id="video" playsinline></video>

  <!-- Buffering overlay -->
  <div id="buffering"><div class="spinner"></div></div>

  <!-- Controls overlay -->
  <div id="controls">
    <!-- Progress bar -->
    <div id="progress-wrap" onclick="seekTo(event)">
      <div id="progress-fill"></div>
      <div id="progress-dot"></div>
    </div>

    <!-- Bottom row -->
    <div id="bottom-row">
      <!-- Play/Pause -->
      <button id="playbtn" onclick="togglePlay()">
        <svg id="play-icon" width="24" height="24" fill="white" viewBox="0 0 24 24">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
        <svg id="pause-icon" width="24" height="24" fill="white" viewBox="0 0 24 24" style="display:none">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      </button>

      <!-- Volume -->
      <div id="vol-wrap">
        <button onclick="toggleMute()">
          <svg id="vol-icon" width="20" height="20" fill="white" viewBox="0 0 24 24">
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </button>
        <input type="range" id="vol-slider" min="0" max="1" step="0.05" value="1" oninput="setVolume(this.value)">
      </div>

      <!-- Time -->
      <span id="time-display">LIVE</span>

      <!-- Quality -->
      <span id="quality-badge">Auto</span>

      <!-- Live badge -->
      <div id="live-badge">
        <div class="live-dot"></div>
        LIVE
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"></script>
<script>
  const video    = document.getElementById('video');
  const controls = document.getElementById('controls');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const fill     = document.getElementById('progress-fill');
  const dot      = document.getElementById('progress-dot');
  const timeDisp = document.getElementById('time-display');
  const qualBadge = document.getElementById('quality-badge');
  const bufWrap  = document.getElementById('buffering');

  let hls, hideTimer, isMuted = false;

  // ── Init HLS ──
  function initHls() {
    const src = "${streamUrl}";
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = hls.levels[data.level];
        qualBadge.textContent = lvl ? lvl.height + 'p' : 'Auto';
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) hls.recoverMediaError();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().catch(() => {});
    }
  }

  // ── Controls auto-hide ──
  function resetHideTimer() {
    controls.classList.remove('hidden');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!video.paused) controls.classList.add('hidden');
    }, 3500);
  }

  document.getElementById('container').addEventListener('touchstart', resetHideTimer);
  document.addEventListener('touchmove', resetHideTimer);

  // ── Play / Pause ──
  function togglePlay() {
    if (video.paused) { video.play(); } else { video.pause(); }
    resetHideTimer();
  }

  video.addEventListener('play', () => {
    playIcon.style.display  = 'none';
    pauseIcon.style.display = 'block';
  });
  video.addEventListener('pause', () => {
    playIcon.style.display  = 'block';
    pauseIcon.style.display = 'none';
    controls.classList.remove('hidden');
  });

  // ── Progress ──
  video.addEventListener('timeupdate', () => {
    if (!video.duration || !isFinite(video.duration)) return;
    const pct = (video.currentTime / video.duration) * 100;
    fill.style.width = pct + '%';
    dot.style.left   = pct + '%';
    timeDisp.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
  });

  function fmt(s) {
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return String(m).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
  }

  function seekTo(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    if (video.duration && isFinite(video.duration)) {
      video.currentTime = pct * video.duration;
    }
    resetHideTimer();
  }

  // ── Volume ──
  function setVolume(v) { video.volume = v; isMuted = v == 0; }
  function toggleMute() {
    isMuted = !isMuted;
    video.muted = isMuted;
    document.getElementById('vol-slider').value = isMuted ? 0 : video.volume;
  }

  // ── Buffering ──
  video.addEventListener('waiting', () => bufWrap.classList.add('show'));
  video.addEventListener('playing', () => bufWrap.classList.remove('show'));
  video.addEventListener('canplay', () => bufWrap.classList.remove('show'));

  // ── Live stream: hide progress for pure live ──
  video.addEventListener('loadedmetadata', () => {
    const isLive = !isFinite(video.duration) || video.duration > 86400;
    if (isLive) {
      document.getElementById('progress-wrap').style.display = 'none';
      timeDisp.textContent = 'LIVE';
    }
  });

  initHls();
  resetHideTimer();
</script>
</body>
</html>
`;

// ── Screen Component ──────────────────────────────────────────
export default function FullPlayerScreen({ navigation, route }) {
  const { streamUrl, title, channelName } = route.params || {};
  const insets    = useSafeAreaInsets();
  const [loading, setLoading]       = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const { width, height }           = Dimensions.get("window");

  // ── Orientation setup ─────────────────────────────────────
  useEffect(() => {
    // Unlock both orientations for this screen
    ScreenOrientation.unlockAsync();

    const sub = ScreenOrientation.addOrientationChangeListener((evt) => {
      const ori = evt.orientationInfo.orientation;
      const land =
        ori === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        ori === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(land);
    });

    // Check current orientation on mount
    ScreenOrientation.getOrientationAsync().then((ori) => {
      const land =
        ori === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        ori === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsLandscape(land);
    });

    return () => {
      // Lock back to portrait when leaving this screen
      ScreenOrientation.removeOrientationChangeListener(sub);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // ── Manual orientation toggle button ──────────────────────
  const toggleOrientation = async () => {
    if (isLandscape) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
  };

  // ── Landscape: full screen — hide top/bottom bars ─────────
  if (isLandscape) {
    return (
      <View style={styles.fullBlack}>
        <WebView
          source={{ html: buildPlayerHTML(streamUrl) }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => setLoading(false)}
          allowsFullscreenVideo
          scrollEnabled={false}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        {/* Rotate back button (top-right) */}
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

  // ── Portrait: top bar + player + info ────────────────────
  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.topInfo}>
          <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.topChannel}>{channelName}</Text>
        </View>

        {/* Rotate to landscape */}
        <TouchableOpacity onPress={toggleOrientation} style={styles.iconBtn}>
          <Text style={styles.iconText}>⛶</Text>
        </TouchableOpacity>

        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Player — 16:9 */}
      <View style={styles.playerBox}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTxt}>جاري تحميل البث...</Text>
          </View>
        )}
        <WebView
          source={{ html: buildPlayerHTML(streamUrl) }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => setLoading(false)}
          allowsFullscreenVideo
          scrollEnabled={false}
        />
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoChannel}>{channelName}</Text>
        <Text style={styles.infoHint}>أدر الهاتف للمشاهدة بملء الشاشة ⤢</Text>
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
  topBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: colors.foreground,
    fontSize: 16,
  },
  topInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  topTitle: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: "right",
  },
  topChannel: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "right",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.live,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  playerBox: {
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 10,
    gap: spacing.md,
  },
  loadingTxt: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  infoBox: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: "flex-end",
  },
  infoTitle: {
    color: colors.foreground,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    textAlign: "right",
  },
  infoChannel: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: "right",
    marginTop: 4,
  },
  infoHint: {
    color: colors.primary,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: "right",
    marginTop: spacing.sm,
    opacity: 0.7,
  },
  floatBtn: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  floatIcon: {
    color: "#fff",
    fontSize: 16,
  },
});
