import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { setApiToken } from "@/services/api";
import { createReminderLogRequest } from "@/services/reminders";
import { Reminder } from "@/types/api";
import { TOKEN_KEY } from "@/constants/storage";

const REMINDER_CATEGORY_ID = "ROUTINE_REMINDER_ACTIONS";
const DEFAULT_CHANNEL_ID = "routine-reminders";
const NOTIFICATION_ID_PREFIX = "rotina_ai_notification_id_";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getReminderNotificationKey(reminderId: string) {
  return `${NOTIFICATION_ID_PREFIX}${reminderId}`;
}

async function ensureApiSessionFromStorage() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (token) {
    setApiToken(token);
  }

  return token;
}

export async function registerNotificationActions() {
  await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
    {
      identifier: "DONE",
      buttonTitle: "Feito",
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: "SNOOZED",
      buttonTitle: "Adiar 10 min",
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: "SKIPPED",
      buttonTitle: "Pular",
      options: {
        opensAppToForeground: true,
        isDestructive: true,
      },
    },
  ]);
}

export async function configureNotificationSystem() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
      name: "Lembretes da rotina",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 250, 400],
      lightColor: "#22C55E",
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }

  await registerNotificationActions();

  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.granted;
}

export async function saveReminderNotificationId(reminderId: string, notificationId: string) {
  await SecureStore.setItemAsync(getReminderNotificationKey(reminderId), notificationId);
}

export async function getReminderNotificationId(reminderId: string) {
  return SecureStore.getItemAsync(getReminderNotificationKey(reminderId));
}

export async function clearReminderNotificationId(reminderId: string) {
  await SecureStore.deleteItemAsync(getReminderNotificationKey(reminderId));
}

export async function cancelReminderNotification(reminderId: string) {
  const notificationId = await getReminderNotificationId(reminderId);

  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
  await clearReminderNotificationId(reminderId);
}

export async function scheduleReminderNotification(reminder: Reminder) {
  const hasPermission = await configureNotificationSystem();

  if (!hasPermission) {
    return null;
  }

  const reminderDate = new Date(reminder.startAt);
  const now = new Date();

  if (Number.isNaN(reminderDate.getTime()) || reminderDate <= now) {
    return null;
  }

  await cancelReminderNotification(reminder.id);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ ${reminder.title}`,
      body: reminder.description || "Hora de cuidar da sua rotina.",
      sound: "default",
      categoryIdentifier: REMINDER_CATEGORY_ID,
      data: {
        reminderId: reminder.id,
        scheduleId: reminder.scheduleId,
        startAt: reminder.startAt,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: DEFAULT_CHANNEL_ID,
    },
  });

  await saveReminderNotificationId(reminder.id, notificationId);

  return notificationId;
}

export async function scheduleSnoozeNotification(reminder: Reminder, minutes = 10) {
  const hasPermission = await configureNotificationSystem();

  if (!hasPermission) {
    return null;
  }

  const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⏰ Lembrete adiado: ${reminder.title}`,
      body: reminder.description || `Lembrete adiado por ${minutes} minutos.`,
      sound: "default",
      categoryIdentifier: REMINDER_CATEGORY_ID,
      data: {
        reminderId: reminder.id,
        scheduleId: reminder.scheduleId,
        snoozed: true,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeDate,
      channelId: DEFAULT_CHANNEL_ID,
    },
  });

  await saveReminderNotificationId(reminder.id, notificationId);

  return notificationId;
}

export function subscribeToNotificationResponses() {
  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data || {};
    const reminderId = typeof data.reminderId === "string" ? data.reminderId : null;
    const actionIdentifier = response.actionIdentifier;

    if (!reminderId) {
      return;
    }

    if (!["DONE", "SNOOZED", "SKIPPED"].includes(actionIdentifier)) {
      return;
    }

    try {
      const token = await ensureApiSessionFromStorage();

      if (!token) {
        return;
      }

      await createReminderLogRequest(reminderId, {
        action: actionIdentifier as "DONE" | "SNOOZED" | "SKIPPED",
        note: "Registrado pela ação rápida da notificação.",
      });

      if (actionIdentifier === "DONE" || actionIdentifier === "SKIPPED") {
        await clearReminderNotificationId(reminderId);
      }
    } catch (error) {
      console.warn("Falha ao registrar ação da notificação", error);
    }
  });

  return () => subscription.remove();
}

export async function scheduleTestNotification() {
  const hasPermission = await configureNotificationSystem();

  if (!hasPermission) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Rotina AI",
      body: "Notificação de teste criada com sucesso.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: DEFAULT_CHANNEL_ID,
    },
  });
}
