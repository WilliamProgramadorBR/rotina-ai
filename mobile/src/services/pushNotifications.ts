import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

const CHAT_CHANNEL_ID = "chat-messages";

export async function setupChatNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
    name: "Mensagens do grupo",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#22C55E",
    sound: "default",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
}

export async function registerPushToken(): Promise<void> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    await api.post("/auth/push-token", { pushToken });
  } catch {
    // Registro do token é best-effort — não bloqueia o app
  }
}
