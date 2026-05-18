const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  priority?: "default" | "normal" | "high";
  channelId?: string;
}

export async function sendExpoPushNotification(payload: PushPayload): Promise<void> {
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        sound: "default",
        priority: "high",
        channelId: "chat-messages",
        ...payload
      })
    });
  } catch {
    // Push notifications are best-effort — never block the main flow
  }
}

export async function sendExpoPushNotificationBatch(payloads: PushPayload[]): Promise<void> {
  if (payloads.length === 0) return;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payloads.map((p) => ({
        sound: "default",
        priority: "high",
        channelId: "chat-messages",
        ...p
      })))
    });
  } catch {
    // Best-effort
  }
}
