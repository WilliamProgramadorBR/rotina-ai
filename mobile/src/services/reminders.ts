import { api, isApiNetworkError } from "./api";
import { scheduleSnoozeAlarm } from "./alarmNotifications";
import { enqueueOfflineMutation } from "./offlineSync";
import { AlarmLevel, Reminder, ReminderAction, ReminderStatus } from "@/types/api";

type CreateReminderPayload = {
  scheduleId: string;
  title: string;
  description?: string;
  notes?: string;
  links?: string[];
  location?: string;
  priority?: string;
  alarmLevel?: string;
  startAt: string;
  endAt?: string;
  recurrenceRule?: string;
  timezone?: string;
};

type SnoozeReminderInput = {
  id: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  alarmLevel?: string | null;
  schedule?: { title?: string | null } | null;
};

function normalizeAlarmLevel(level?: string | null): AlarmLevel | null {
  if (level === "LEVE" || level === "IMPORTANTE" || level === "CRITICO" || level === "ROTINA") {
    return level;
  }

  return null;
}

export async function listTodayRemindersRequest() {
  const { data } = await api.get<{ reminders: Reminder[] }>("/reminders/today");
  return data.reminders;
}

export async function createReminderRequest(payload: CreateReminderPayload) {
  const { data } = await api.post<{ reminder: Reminder }>("/reminders", payload);
  return data.reminder;
}

export async function createReminderOfflineSafeRequest(payload: CreateReminderPayload) {
  try {
    const reminder = await createReminderRequest(payload);
    return { reminder, queued: false };
  } catch (error) {
    if (!isApiNetworkError(error)) {
      throw error;
    }

    await enqueueOfflineMutation({
      kind: "CREATE_REMINDER",
      payload
    });

    return { reminder: null, queued: true };
  }
}

export async function createReminderLogRequest(
  reminderId: string,
  payload: { action: ReminderAction; note?: string }
) {
  try {
    const { data } = await api.post(`/reminders/${reminderId}/log`, payload);
    return { ...data, queued: false };
  } catch (error) {
    if (!isApiNetworkError(error)) {
      throw error;
    }

    await enqueueOfflineMutation({
      kind: "REMINDER_LOG",
      payload: {
        reminderId,
        action: payload.action,
        note: payload.note
      }
    });

    return { queued: true };
  }
}

export async function updateReminderRequest(
  reminderId: string,
  payload: Record<string, unknown>
) {
  const { data } = await api.patch<{ reminder: Reminder }>(
    `/reminders/${reminderId}`,
    payload
  );

  return data.reminder;
}

export async function updateReminderOfflineSafeRequest(
  reminderId: string,
  payload: Record<string, unknown>
) {
  try {
    const reminder = await updateReminderRequest(reminderId, payload);
    return { reminder, queued: false };
  } catch (error) {
    if (!isApiNetworkError(error)) {
      throw error;
    }

    await enqueueOfflineMutation({
      kind: "UPDATE_REMINDER",
      payload: {
        reminderId,
        data: payload
      }
    });

    return { reminder: null, queued: true };
  }
}

export async function snoozeReminderRequest(
  reminder: SnoozeReminderInput,
  minutes = 10
) {
  const snoozedStartAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  const update = await updateReminderOfflineSafeRequest(reminder.id, {
    startAt: snoozedStartAt
  });

  const log = await createReminderLogRequest(reminder.id, {
    action: "SNOOZED",
    note: `Adiado por ${minutes} minutos pelo app.`
  });

  let alarmScheduled = false;

  try {
    await scheduleSnoozeAlarm(
      {
        reminderId: reminder.id,
        title: reminder.title,
        description: reminder.description,
        startAt: snoozedStartAt,
        scheduleTitle: reminder.schedule?.title || "Lembrete",
        alarmLevel: normalizeAlarmLevel(reminder.alarmLevel)
      },
      minutes
    );
    alarmScheduled = true;
  } catch (error) {
    console.log("[SNOOZE ALARM ERROR]", error);
  }

  return {
    reminder: update.reminder,
    queued: update.queued || Boolean(log.queued),
    snoozedStartAt,
    alarmScheduled
  };
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
