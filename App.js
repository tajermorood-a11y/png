// App.js v3 — push notifications (anonymous, no auth required)

import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import {
  useFonts,
  Tajawal_300Light,
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
  Tajawal_900Black,
} from "@expo-google-fonts/tajawal";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";

import HomeScreen       from "./src/screens/HomeScreen";
import FullPlayerScreen from "./src/screens/FullPlayerScreen";
import MiniPlayerScreen from "./src/screens/MiniPlayerScreen";
import { colors }       from "./src/theme/colors";
import {
  initPushNotifications,
  addNotificationListeners,
} from "./src/services/notificationsService";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Tajawal_300Light,
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
    Tajawal_900Black,
  });

  const navigationRef = useRef(null);

  useEffect(() => {
    // Register + save token immediately on launch (no auth needed)
    initPushNotifications();

    // Notification listeners
    const removeListeners = addNotificationListeners({
      onReceive: (notification) => {
        console.log("[App] Foreground notification:", notification.request.content.title);
      },
      onResponse: (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen && navigationRef.current) {
          navigationRef.current.navigate(data.screen, data.params || {});
        }
      },
    });

    // Handle notification that launched the app
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data?.screen) {
        const { screen, params } = response.notification.request.content.data;
        setTimeout(() => navigationRef.current?.navigate(screen, params || {}), 500);
      }
    });

    return () => removeListeners();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="Home"       component={HomeScreen} />
          <Stack.Screen name="FullPlayer" component={FullPlayerScreen} />
          <Stack.Screen name="MiniPlayer" component={MiniPlayerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
