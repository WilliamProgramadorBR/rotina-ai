import { scheduleReminderAlarm } from "./alarmNotifications";
import { api } from "./api";
import { Schedule, ScheduleCategory, ScheduleSourceType } from "@/types/api";

export async function listSchedulesRequest() {
  const { data } = await api.get<{ schedules: Schedule[] }>("/schedules");

  return data.schedules;
}

export async function getScheduleRequest(id: string) {
  const { data } = await api.get<{ schedule: Schedule }>(`/schedules/${id}`);

  return data.schedule;
}

export async function createScheduleRequest(payload: {
  title: string;
  description?: string;
  category: ScheduleCategory;
  sourceType?: ScheduleSourceType;
}) {
  const { data } = await api.post<{ schedule: Schedule }>("/schedules", payload);

  return data.schedule;
}

export async function deleteScheduleRequest(id: string) {
  const { data } = await api.delete<{ message: string }>(`/schedules/${id}`);

  return data;
}

export async function scheduleAlarmsForSchedule(schedule: Schedule) {
  for (const reminder of schedule.reminders || []) {
    await scheduleReminderAlarm({
      reminderId: reminder.id,
      title: reminder.title,
      description: reminder.description,
      startAt: reminder.startAt,
      scheduleTitle: schedule.title
    });
  }
}