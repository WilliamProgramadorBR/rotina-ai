import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { DashboardMetrics } from "../types/api";

const NOTIF_ID_KEY = "rotina-ai-weekly-report-notif-id";
const ENABLED_KEY = "rotina-ai-weekly-report-enabled";
const HOUR_KEY = "rotina-ai-weekly-report-hour";
const CHANNEL_ID = "rotina-ai-weekly-report";

const DEFAULT_HOUR = 9;

export async function getWeeklyReportEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ENABLED_KEY);
    return val !== "false";
  } catch {
    return true;
  }
}

export async function setWeeklyReportEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(ENABLED_KEY, enabled ? "true" : "false");
}

export async function getWeeklyReportHour(): Promise<number> {
  try {
    const val = await SecureStore.getItemAsync(HOUR_KEY);
    const parsed = val ? parseInt(val, 10) : DEFAULT_HOUR;
    return isNaN(parsed) ? DEFAULT_HOUR : parsed;
  } catch {
    return DEFAULT_HOUR;
  }
}

export async function setWeeklyReportHour(hour: number): Promise<void> {
  await SecureStore.setItemAsync(HOUR_KEY, String(hour));
}

function buildNotificationContent(metrics: DashboardMetrics | null): {
  title: string;
  body: string;
} {
  if (!metrics) {
    return {
      title: "📊 Resumo semanal — Rotina AI",
      body: "Confira como foi sua semana e planeje a próxima com IA."
    };
  }

  const rate = Math.round(metrics.summary.completionRate * 100);
  const streak = metrics.summary.streakDays;
  const done = metrics.summary.doneReminders;
  const total = metrics.summary.totalReminders;
  const best = metrics.summary.bestCategory;

  let body: string;

  if (rate >= 80) {
    body = `Semana incrível! ✅ ${done}/${total} atividades concluídas (${rate}%).`;
    if (streak > 0) body += ` ${streak} dias de sequência 🔥`;
  } else if (rate >= 50) {
    body = `Boa semana! ${rate}% concluído (${done}/${total}).`;
    if (best) body += ` Melhor categoria: ${best}.`;
    body += " Que tal ir além semana que vem?";
  } else {
    body = `${rate}% concluído essa semana (${done}/${total}).`;
    body += " Use o botão IA para replanejar e retomar o ritmo 💪";
  }

  return {
    title: "📊 Sua semana — Rotina AI",
    body
  };
}

async function ensureWeeklyChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Relatório semanal",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: "#6366F1"
  });
}

async function getSavedNotifId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(NOTIF_ID_KEY);
  } catch {
    return null;
  }
}

async function saveNotifId(id: string) {
  await SecureStore.setItemAsync(NOTIF_ID_KEY, id);
}

async function clearNotifId() {
  try {
    await SecureStore.deleteItemAsync(NOTIF_ID_KEY);
  } catch {}
}

export async function cancelWeeklyReport(): Promise<void> {
  const id = await getSavedNotifId();
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await clearNotifId();
  }
}

export async function scheduleWeeklyReport(
  metrics: DashboardMetrics | null
): Promise<void> {
  const enabled = await getWeeklyReportEnabled();
  if (!enabled) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  await ensureWeeklyChannel();
  await cancelWeeklyReport();

  const hour = await getWeeklyReportHour();
  const { title, body } = buildNotificationContent(metrics);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: { type: "WEEKLY_REPORT" }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour,
      minute: 0,
      channelId: CHANNEL_ID
    } as any
  });

  await saveNotifId(id);
}
