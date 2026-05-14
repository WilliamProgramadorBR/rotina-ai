import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, AppState, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from "@expo-google-fonts/inter";
import { Manrope_800ExtraBold } from "@expo-google-fonts/manrope";

import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider, useThemeMode } from "../src/context/ThemeContext";
import { AppUpdateInstaller } from "../src/components/AppUpdateInstaller";
import { configureAlarmNotifications } from "../src/services/alarmNotifications";
import { openAlarmFromNotificationResponse } from "../src/services/alarmNavigation";
import { flushOfflineQueue } from "../src/services/offlineSync";
import { scheduleWeeklyReport } from "../src/services/weeklyReport";
import { getDashboardMetricsRequest } from "../src/services/metrics";
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

function WeeklyReportObserver() {
  useEffect(() => {
    getDashboardMetricsRequest()
      .then((metrics) => scheduleWeeklyReport(metrics))
      .catch(() => scheduleWeeklyReport(null));

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      if (data.type === "WEEKLY_REPORT") {
        router.push("/weekly-review");
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
}

function OfflineSyncObserver() {
  useEffect(() => {
    let active = true;

    async function sync() {
      if (!active) return;

      try {
        const result = await flushOfflineQueue();

        if (result.synced > 0) {
          console.log("[OFFLINE SYNC] Sincronizado", result);
        }
      } catch (error) {
        console.log("[OFFLINE SYNC ERROR]", error);
      }
    }

    sync();

    const interval = setInterval(sync, 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        sync();
      }
    });

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
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
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const { theme, isDark } = useThemeMode();

  return (
    <AuthProvider>
      <AlarmNotificationObserver />
      <WeeklyReportObserver />
      <OfflineSyncObserver />
      <AppUpdateInstaller />
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />
    </AuthProvider>
  );
}
