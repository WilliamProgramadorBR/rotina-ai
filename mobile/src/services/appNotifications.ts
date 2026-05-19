import { api } from "./api";

export type AppNotificationType = "CHAT_MESSAGE" | "GROUP_INVITE";

export interface AppNotification {
  id: string;
  userId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

export async function listAppNotificationsRequest(opts?: {
  unreadOnly?: boolean;
  cursor?: string;
}): Promise<NotificationsResponse> {
  const params: Record<string, string> = {};
  if (opts?.unreadOnly) params.unreadOnly = "true";
  if (opts?.cursor) params.cursor = opts.cursor;

  const { data } = await api.get<NotificationsResponse>("/notifications", { params });
  return data;
}

export async function getUnreadCountRequest(): Promise<number> {
  const { data } = await api.get<{ unreadCount: number }>("/notifications/unread-count");
  return data.unreadCount;
}

export async function markNotificationReadRequest(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsReadRequest(): Promise<void> {
  await api.post("/notifications/read-all");
}
