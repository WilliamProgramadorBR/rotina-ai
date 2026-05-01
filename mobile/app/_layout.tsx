import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";

import { AuthProvider } from "../src/context/AuthContext";
import { configureAlarmNotifications } from "../src/services/alarmNotifications";
import { openAlarmFromNotificationResponse } from "../src/services/alarmNavigation";

function AlarmNotificationObserver() {
  useEffect(() => {
    configureAlarmNotifications().catch((error) => {
      console.log("[ALARM CONFIG ERROR]", error);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;

        setTimeout(() => {
          openAlarmFromNotificationResponse(response);
        }, 600);
      })
      .catch((error) => {
        console.log("[LAST NOTIFICATION RESPONSE ERROR]", error);
      });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        openAlarmFromNotificationResponse(response);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AlarmNotificationObserver />
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerShown: false
        }}
      />
    </AuthProvider>
  );
}