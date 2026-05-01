import * as Notifications from "expo-notifications";
import { router } from "expo-router";

function getAlarmDataFromResponse(response: Notifications.NotificationResponse) {
  const content = response.notification.request.content;
  const data = content.data || {};

  return {
    actionIdentifier: response.actionIdentifier,
    type: data.type,
    reminderId: data.reminderId,
    title: data.title || content.title || "Alarme",
    description: data.description || content.body || "",
    startAt: data.startAt || "",
    scheduleTitle: data.scheduleTitle || ""
  };
}

export function openAlarmFromNotificationResponse(
  response: Notifications.NotificationResponse
) {
  const data = getAlarmDataFromResponse(response);

  if (data.type !== "REMINDER_ALARM" || !data.reminderId) {
    return;
  }

  router.push({
    pathname: "/alarm-active",
    params: {
      reminderId: String(data.reminderId),
      title: String(data.title || "Alarme"),
      description: String(data.description || ""),
      startAt: String(data.startAt || ""),
      scheduleTitle: String(data.scheduleTitle || ""),
      action: String(data.actionIdentifier || Notifications.DEFAULT_ACTION_IDENTIFIER)
    }
  });
}