import { scheduleReminderAlarm } from "./alarmNotifications";
import { api, isApiNetworkError } from "./api";
import { enqueueOfflineMutation } from "./offlineSync";
import { Schedule, ScheduleCategory, ScheduleSourceType } from "@/types/api";

type CreateSchedulePayload = {
  title: string;
  description?: string;
  notes?: string;
  links?: string[];
  extraInfo?: string;
  category: ScheduleCategory;
  sourceType?: ScheduleSourceType;
};

export async function listSchedulesRequest() {
  const { data } = await api.get<{ schedules: Schedule[] }>("/schedules");

  return data.schedules;
}

export async function getScheduleRequest(id: string) {
  const { data } = await api.get<{ schedule: Schedule }>(`/schedules/${id}`);

  return data.schedule;
}

export async function createScheduleRequest(payload: CreateSchedulePayload) {
  const { data } = await api.post<{ schedule: Schedule }>("/schedules", payload);

  return data.schedule;
}

export async function createScheduleOfflineSafeRequest(payload: CreateSchedulePayload) {
  try {
    const schedule = await createScheduleRequest(payload);
    return { schedule, queued: false };
  } catch (error) {
    if (!isApiNetworkError(error)) {
      throw error;
    }

    await enqueueOfflineMutation({
      kind: "CREATE_SCHEDULE",
      payload
    });

    return { schedule: null, queued: true };
  }
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
