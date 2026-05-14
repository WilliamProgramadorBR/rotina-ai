import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { AlarmLevel } from "../types/api";

export const ALARM_SOUND_FILE_NAME = "rotina_alarm.wav";

export const ALARM_CHANNEL_CRITICO = "rotina_channel_critico";
export const ALARM_CHANNEL_IMPORTANTE = "rotina_ai_alarm_channel_v2";
export const ALARM_CHANNEL_LEVE = "rotina_channel_leve";
export const ALARM_CHANNEL_ROTINA = "rotina_channel_rotina";

export const ALARM_CATEGORY_ID = "rotina_ai_alarm_category";

export type AlarmNotificationPayload = {
  reminderId: string;
  title: string;
  description?: string | null;
  startAt?: string;
  scheduleTitle?: string;
  alarmLevel?: AlarmLevel | null;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX
  })
});

export function getAlarmLevelMeta(level?: AlarmLevel | null) {
  switch (level) {
    case "CRITICO":
      return {
        channelId: ALARM_CHANNEL_CRITICO,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        autoDismiss: false,
        bypassDnd: true,
        vibrate: [0, 700, 250, 700, 250, 1100, 250, 700],
        emoji: "🚨",
        label: "Crítico"
      };
    case "LEVE":
      return {
        channelId: ALARM_CHANNEL_LEVE,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        sticky: false,
        autoDismiss: true,
        bypassDnd: false,
        vibrate: [0, 200],
        emoji: "🔔",
        label: "Leve"
      };
    case "ROTINA":
      return {
        channelId: ALARM_CHANNEL_ROTINA,
        priority: Notifications.AndroidNotificationPriority.LOW,
        sticky: false,
        autoDismiss: true,
        bypassDnd: false,
        vibrate: [0, 100],
        emoji: "💧",
        label: "Rotina"
      };
    default:
      return {
        channelId: ALARM_CHANNEL_IMPORTANTE,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        autoDismiss: false,
        bypassDnd: true,
        vibrate: [0, 700, 250, 700, 250, 1100],
        emoji: "⏰",
        label: "Importante"
      };
  }
}

export async function configureAlarmNotifications() {
  if (Platform.OS !== "android") {
    await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
      { identifier: "DONE", buttonTitle: "Feito", options: { opensAppToForeground: true } },
      { identifier: "SNOOZE", buttonTitle: "Soneca 10 min", options: { opensAppToForeground: true } },
      { identifier: "SKIP", buttonTitle: "Pular", options: { opensAppToForeground: true, isDestructive: true } }
    ]);
    return;
  }

  await Promise.all([
    Notifications.setNotificationChannelAsync(ALARM_CHANNEL_CRITICO, {
      name: "Alarmes Críticos",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 700, 250, 700, 250, 1100, 250, 700],
      lightColor: "#E11D48",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: ALARM_SOUND_FILE_NAME,
      bypassDnd: true,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION
      }
    }),
    Notifications.setNotificationChannelAsync(ALARM_CHANNEL_IMPORTANTE, {
      name: "Alarmes da rotina",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 700, 250, 700, 250, 1100],
      lightColor: "#2563EB",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: ALARM_SOUND_FILE_NAME,
      bypassDnd: true,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION
      }
    }),
    Notifications.setNotificationChannelAsync(ALARM_CHANNEL_LEVE, {
      name: "Lembretes Leves",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: "#10B981",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: undefined,
      bypassDnd: false,
      enableVibrate: true,
      showBadge: false
    }),
    Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ROTINA, {
      name: "Lembretes de Rotina",
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 100],
      lightColor: "#06B6D4",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: undefined,
      bypassDnd: false,
      enableVibrate: false,
      showBadge: false
    })
  ]);

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    { identifier: "DONE", buttonTitle: "Feito", options: { opensAppToForeground: true } },
    { identifier: "SNOOZE", buttonTitle: "Soneca 10 min", options: { opensAppToForeground: true } },
    { identifier: "SKIP", buttonTitle: "Pular", options: { opensAppToForeground: true, isDestructive: true } }
  ]);
}

export async function requestAlarmNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function scheduleReminderAlarm(payload: AlarmNotificationPayload) {
  await configureAlarmNotifications();

  const hasPermission = await requestAlarmNotificationPermission();

  if (!hasPermission) {
    throw new Error("Permissão de notificação não concedida.");
  }

  if (!payload.startAt) {
    throw new Error("Data/hora do lembrete não informada.");
  }

  const date = new Date(payload.startAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data/hora do lembrete inválida.");
  }

  if (date.getTime() <= Date.now()) {
    console.log("[ALARM] Lembrete no passado. Não será agendado.", payload);
    return null;
  }

  const meta = getAlarmLevelMeta(payload.alarmLevel);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${meta.emoji} ${payload.title}`,
      body: payload.description || payload.scheduleTitle || "Você tem um lembrete agora.",
      sound: meta.channelId === ALARM_CHANNEL_LEVE || meta.channelId === ALARM_CHANNEL_ROTINA
        ? undefined
        : ALARM_SOUND_FILE_NAME,
      priority: meta.priority,
      categoryIdentifier: ALARM_CATEGORY_ID,
      sticky: meta.sticky,
      autoDismiss: meta.autoDismiss,
      vibrate: meta.vibrate,
      color: meta.channelId === ALARM_CHANNEL_CRITICO ? "#E11D48" : "#2563EB",
      data: {
        type: "REMINDER_ALARM",
        reminderId: payload.reminderId,
        title: payload.title,
        description: payload.description || "",
        startAt: payload.startAt,
        scheduleTitle: payload.scheduleTitle || "",
        alarmLevel: payload.alarmLevel || "IMPORTANTE"
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: Platform.OS === "android" ? meta.channelId : undefined
    }
  });

  console.log("[ALARM] Notificação agendada", {
    notificationId,
    reminderId: payload.reminderId,
    alarmLevel: payload.alarmLevel || "IMPORTANTE",
    date
  });

  return notificationId;
}

export async function scheduleSnoozeAlarm(payload: AlarmNotificationPayload, minutes = 10) {
  await configureAlarmNotifications();

  const hasPermission = await requestAlarmNotificationPermission();

  if (!hasPermission) {
    throw new Error("Permissão de notificação não concedida.");
  }

  const date = new Date(Date.now() + minutes * 60 * 1000);
  const meta = getAlarmLevelMeta(payload.alarmLevel);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `😴 Soneca: ${payload.title}`,
      body: `Adiado por ${minutes} minutos.`,
      sound: meta.channelId === ALARM_CHANNEL_LEVE || meta.channelId === ALARM_CHANNEL_ROTINA
        ? undefined
        : ALARM_SOUND_FILE_NAME,
      priority: meta.priority,
      categoryIdentifier: ALARM_CATEGORY_ID,
      sticky: meta.sticky,
      autoDismiss: meta.autoDismiss,
      vibrate: meta.vibrate,
      color: "#2563EB",
      data: {
        type: "REMINDER_ALARM",
        reminderId: payload.reminderId,
        title: payload.title,
        description: payload.description || "",
        startAt: date.toISOString(),
        scheduleTitle: payload.scheduleTitle || "",
        snoozed: true,
        alarmLevel: payload.alarmLevel || "IMPORTANTE"
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: Platform.OS === "android" ? meta.channelId : undefined
    }
  });

  console.log("[ALARM] Soneca agendada", {
    notificationId,
    reminderId: payload.reminderId,
    date
  });

  return notificationId;
}
