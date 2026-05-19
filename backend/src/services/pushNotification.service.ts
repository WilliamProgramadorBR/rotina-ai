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

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

async function logPushErrors(tickets: ExpoTicket[], payloads: PushPayload[]) {
  tickets.forEach((ticket, i) => {
    if (ticket.status === "error") {
      const token = payloads[i]?.to?.slice(0, 20) + "...";
      console.warn(`[PUSH] Erro ao entregar para ${token}: ${ticket.message} (${ticket.details?.error})`);
    }
  });
}

export async function sendExpoPushNotification(payload: PushPayload): Promise<void> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
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

    const json = await res.json().catch(() => null);
    if (json?.data) {
      const tickets: ExpoTicket[] = Array.isArray(json.data) ? json.data : [json.data];
      await logPushErrors(tickets, [payload]);
    }
  } catch (err) {
    console.warn("[PUSH] Falha ao enviar notificação:", err);
  }
}

export async function sendExpoPushNotificationBatch(payloads: PushPayload[]): Promise<void> {
  if (payloads.length === 0) return;

  try {
    const body = payloads.map((p) => ({
      sound: "default",
      priority: "high",
      channelId: "chat-messages",
      ...p
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });

    const json = await res.json().catch(() => null);
    if (json?.data) {
      const tickets: ExpoTicket[] = Array.isArray(json.data) ? json.data : [json.data];
      await logPushErrors(tickets, payloads);
    }
  } catch (err) {
    console.warn("[PUSH BATCH] Falha ao enviar notificações:", err);
  }
}
