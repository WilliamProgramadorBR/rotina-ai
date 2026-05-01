import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const ALARM_CHANNEL_ID = "rotina_ai_alarm_channel";
export const ALARM_CATEGORY_ID = "rotina_ai_alarm_category";

export type AlarmNotificationPayload = {
  reminderId: string;
  title: string;
  description?: string | null;
  startAt?: string;
  scheduleTitle?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function configureAlarmNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: "Alarmes da rotina",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 350, 250, 350],
      lightColor: "#2563EB",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default"
    });
  }

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    {
      identifier: "DONE",
      buttonTitle: "Feito",
      options: {
        opensAppToForeground: true
      }
    },
    {
      identifier: "SNOOZE",
      buttonTitle: "Soneca 10 min",
      options: {
        opensAppToForeground: true
      }
    },
    {
      identifier: "SKIP",
      buttonTitle: "Pular",
      options: {
        opensAppToForeground: true,
        isDestructive: true
      }
    }
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

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${payload.title}`,
      body: payload.description || payload.scheduleTitle || "Você tem um lembrete agora.",
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
      categoryIdentifier: ALARM_CATEGORY_ID,
      data: {
        type: "REMINDER_ALARM",
        reminderId: payload.reminderId,
        title: payload.title,
        description: payload.description || "",
        startAt: payload.startAt,
        scheduleTitle: payload.scheduleTitle || ""
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: Platform.OS === "android" ? ALARM_CHANNEL_ID : undefined
    }
  });

  console.log("[ALARM] Notificação agendada", {
    notificationId,
    reminderId: payload.reminderId,
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

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `😴 Soneca: ${payload.title}`,
      body: `Adiado por ${minutes} minutos.`,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
      categoryIdentifier: ALARM_CATEGORY_ID,
      data: {
        type: "REMINDER_ALARM",
        reminderId: payload.reminderId,
        title: payload.title,
        description: payload.description || "",
        startAt: date.toISOString(),
        scheduleTitle: payload.scheduleTitle || "",
        snoozed: true
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: Platform.OS === "android" ? ALARM_CHANNEL_ID : undefined
    }
  });

  console.log("[ALARM] Soneca agendada", {
    notificationId,
    reminderId: payload.reminderId,
    date
  });

  return notificationId;
}