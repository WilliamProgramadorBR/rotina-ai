import { api } from "./api";
import { Reminder, ReminderAction, ReminderStatus } from "@/types/api";

export async function listTodayRemindersRequest() {
  const { data } = await api.get<{ reminders: Reminder[] }>("/reminders/today");
  return data.reminders;
}

export async function createReminderRequest(payload: {
  scheduleId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  recurrenceRule?: string;
  timezone?: string;
}) {
  const { data } = await api.post<{ reminder: Reminder }>("/reminders", payload);
  return data.reminder;
}

export async function createReminderLogRequest(
  reminderId: string,
  payload: { action: ReminderAction; note?: string }
) {
  const { data } = await api.post(`/reminders/${reminderId}/log`, payload);
  return data;
}

export async function updateReminderStatusRequest(
  reminderId: string,
  status: ReminderStatus
) {
  const { data } = await api.patch<{ reminder: Reminder }>(
    `/reminders/${reminderId}/status`,
    { status }
  );

  return data.reminder;
}
