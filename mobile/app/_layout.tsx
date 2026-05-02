import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from "@expo-google-fonts/inter";
import { Manrope_800ExtraBold } from "@expo-google-fonts/manrope";

import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { configureAlarmNotifications } from "../src/services/alarmNotifications";
import { openAlarmFromNotificationResponse } from "../src/services/alarmNavigation";
import { colors } from "../src/theme";

function AlarmNotificationObserver() {
  useEffect(() => {
    configureAlarmNotifications().catch((error) => console.log("[ALARM CONFIG ERROR]", error));

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        setTimeout(() => openAlarmFromNotificationResponse(response), 600);
      })
      .catch((error) => console.log("[LAST NOTIFICATION RESPONSE ERROR]", error));

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openAlarmFromNotificationResponse(response);
    });

    return () => subscription.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_800ExtraBold
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AlarmNotificationObserver />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
