// src/services/notificationsService.js
// v2 — saves token anonymously (no auth required)

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "../api/supabaseClient";

// Show banner + sound even while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

// ── 1. Request permission + get Expo push token ────────────
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn("[Push] Physical device required.");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Permission denied.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ملعبنا",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
      sound: "default",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    console.log("[Push] Token:", tokenData.data);
    return tokenData.data;
  } catch (err) {
    console.error("[Push] getExpoPushTokenAsync failed:", err);
    return null;
  }
}

// ── 2. Save token to device_tokens (no auth needed) ────────
export async function saveTokenAnonymously(token) {
  if (!token) return;

  const { error } = await supabase
    .from("device_tokens")
    .upsert(
      {
        fcm_token:   token,
        device_type: Platform.OS,
        updated_at:  new Date().toISOString(),
      },
      { onConflict: "fcm_token" }
    );

  if (error) {
    console.error("[Push] Failed to save token:", error.message);
  } else {
    console.log("[Push] Token saved ✓");
  }
}

// ── 3. Full init — call on app launch ──────────────────────
export async function initPushNotifications() {
  const token = await registerForPushNotifications();
  if (token) await saveTokenAnonymously(token);
  return token;
}

// ── 4. Send via Edge Function ───────────────────────────────
export async function sendPushNotification({ token, title, body }) {
  const { data, error } = await supabase.functions.invoke("send-push", {
    body: { token, title, body },
  });
  if (error) {
    console.error("[Push] Error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ── 5. Listeners ────────────────────────────────────────────
export function addNotificationListeners({ onReceive, onResponse } = {}) {
  const r = Notifications.addNotificationReceivedListener((n) => onReceive?.(n));
  const s = Notifications.addNotificationResponseReceivedListener((r) => onResponse?.(r));
  return () => {
    Notifications.removeNotificationSubscription(r);
    Notifications.removeNotificationSubscription(s);
  };
}
