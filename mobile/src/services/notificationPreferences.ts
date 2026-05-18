import { api } from "./api";

export interface NotificationPreferences {
  id: string;
  userId: string;
  chatNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getNotificationPreferencesRequest(): Promise<NotificationPreferences> {
  const { data } = await api.get<{ preferences: NotificationPreferences }>("/notifications/preferences");
  return data.preferences;
}

export async function updateNotificationPreferencesRequest(
  payload: Partial<Pick<NotificationPreferences, "chatNotificationsEnabled">>
): Promise<NotificationPreferences> {
  const { data } = await api.patch<{ preferences: NotificationPreferences }>("/notifications/preferences", payload);
  return data.preferences;
}
