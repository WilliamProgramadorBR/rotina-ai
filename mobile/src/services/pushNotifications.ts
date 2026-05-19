import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
import { api } from "./api";

const CHAT_CHANNEL_ID = "chat-messages";
const INVITE_CHANNEL_ID = "group-invites";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX
  })
});

export async function setupChatNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(CHAT_CHANNEL_ID, {
      name: "Mensagens do grupo",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22C55E",
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    }),
    Notifications.setNotificationChannelAsync(INVITE_CHANNEL_ID, {
      name: "Convites de grupo",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#8B5CF6",
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    })
  ]);
}

export async function registerPushToken(): Promise<void> {
  try {
    // Pede permissão se ainda não foi concedida
    let { granted } = await Notifications.getPermissionsAsync();
    if (!granted) {
      const result = await Notifications.requestPermissionsAsync();
      granted = result.granted;
    }
    if (!granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) {
      console.warn("[PUSH] projectId ausente em Constants.expoConfig.extra.eas");
      return;
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post("/auth/push-token", { pushToken });
  } catch (err) {
    console.warn("[PUSH] Falha ao registrar push token:", err);
  }
}

// Chama setupChatNotificationChannel + registerPushToken e mantém token
// atualizado toda vez que o app volta ao foreground.
export function startPushService(options: { registerToken?: boolean } = {}): () => void {
  const shouldRegisterToken = options.registerToken !== false;

  // Configura canais imediatamente (persiste no SO mesmo com app fechado)
  setupChatNotificationChannel().catch(() => {});

  if (shouldRegisterToken) {
    registerPushToken().catch(() => {});
  }

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active" && shouldRegisterToken) {
      registerPushToken().catch(() => {});
    }
  });

  return () => sub.remove();
}
