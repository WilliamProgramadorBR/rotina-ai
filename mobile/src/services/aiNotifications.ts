import * as Notifications from "expo-notifications";

type ReminderLike = {
  id?: string;
  title: string;
  description?: string | null;
  startAt: string;
};

export async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleLocalNotificationForReminder(reminder: ReminderLike) {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return null;

    const date = new Date(reminder.startAt);
    if (date.getTime() <= Date.now()) return null;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.description || "Você tem um lembrete agora.",
        data: { reminderId: reminder.id },
        sound: true
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date
      }
    });
  } catch (error) {
    console.log("[NOTIFICATION] Erro ao agendar:", error);
    return null;
  }
}

export async function scheduleLocalNotificationsForReminders(reminders: ReminderLike[]) {
  const results = [];
  for (const reminder of reminders) {
    results.push(await scheduleLocalNotificationForReminder(reminder));
  }
  return results;
}
