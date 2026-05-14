import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { api, getAuthToken, isApiNetworkError } from "./api";
import { scheduleReminderAlarm } from "./alarmNotifications";
import type { AlarmLevel, ReminderAction } from "@/types/api";

const QUEUE_STORAGE_KEY = "rotina-ai-offline-sync-queue";
const QUEUE_FILE_URI = `${FileSystem.documentDirectory || ""}rotina-ai-offline-sync-queue.json`;

type CreateSchedulePayload = {
  title: string;
  description?: string;
  notes?: string;
  links?: string[];
  extraInfo?: string;
  category: string;
  sourceType?: string;
};

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

type ReminderLogPayload = {
  reminderId: string;
  action: ReminderAction;
  note?: string;
};

type UpdateReminderPayload = {
  reminderId: string;
  data: Record<string, unknown>;
};

export type OfflineMutation =
  | {
      id: string;
      kind: "CREATE_SCHEDULE";
      payload: CreateSchedulePayload;
      createdAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      kind: "CREATE_REMINDER";
      payload: CreateReminderPayload;
      createdAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      kind: "REMINDER_LOG";
      payload: ReminderLogPayload;
      createdAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      kind: "UPDATE_REMINDER";
      payload: UpdateReminderPayload;
      createdAt: string;
      attempts: number;
      lastError?: string;
    };

type OfflineMutationInput =
  | { kind: "CREATE_SCHEDULE"; payload: CreateSchedulePayload }
  | { kind: "CREATE_REMINDER"; payload: CreateReminderPayload }
  | { kind: "REMINDER_LOG"; payload: ReminderLogPayload }
  | { kind: "UPDATE_REMINDER"; payload: UpdateReminderPayload };

let syncInProgress = false;

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function makeMutationId(kind: OfflineMutation["kind"]) {
  return `${kind.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseQueue(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as OfflineMutation[] : [];
  } catch {
    return [];
  }
}

async function readQueueFromStorage() {
  if (Platform.OS === "web") {
    return parseQueue(canUseLocalStorage() ? window.localStorage.getItem(QUEUE_STORAGE_KEY) : null);
  }

  try {
    const info = await FileSystem.getInfoAsync(QUEUE_FILE_URI);

    if (!info.exists) {
      return [];
    }

    return parseQueue(await FileSystem.readAsStringAsync(QUEUE_FILE_URI));
  } catch (error) {
    console.log("[OFFLINE SYNC] Erro ao ler fila:", error);
    return [];
  }
}

async function writeQueueToStorage(queue: OfflineMutation[]) {
  const raw = JSON.stringify(queue);

  if (Platform.OS === "web") {
    if (canUseLocalStorage()) {
      window.localStorage.setItem(QUEUE_STORAGE_KEY, raw);
    }
    return;
  }

  await FileSystem.writeAsStringAsync(QUEUE_FILE_URI, raw);
}

export async function getOfflineQueue() {
  return readQueueFromStorage();
}

export async function getOfflineQueueCount() {
  const queue = await readQueueFromStorage();
  return queue.length;
}

export async function enqueueOfflineMutation(input: OfflineMutationInput) {
  const queue = await readQueueFromStorage();
  const mutation = {
    id: makeMutationId(input.kind),
    kind: input.kind,
    payload: input.payload,
    createdAt: new Date().toISOString(),
    attempts: 0
  } as OfflineMutation;

  queue.push(mutation);
  await writeQueueToStorage(queue);

  return mutation;
}

async function performQueuedMutation(mutation: OfflineMutation) {
  if (mutation.kind === "CREATE_SCHEDULE") {
    await api.post("/schedules", mutation.payload);
    return;
  }

  if (mutation.kind === "CREATE_REMINDER") {
    const response = await api.post("/reminders", mutation.payload);
    const reminder = response.data.reminder;

    try {
      await scheduleReminderAlarm({
        reminderId: reminder.id,
        title: reminder.title,
        description: reminder.description,
        startAt: reminder.startAt,
        scheduleTitle: reminder.schedule?.title || "Lembrete manual",
        alarmLevel: reminder.alarmLevel as AlarmLevel | null
      });
    } catch (error) {
      console.log("[OFFLINE SYNC] Lembrete sincronizado, mas alarme local nao foi agendado:", error);
    }

    return;
  }

  if (mutation.kind === "REMINDER_LOG") {
    await api.post(`/reminders/${mutation.payload.reminderId}/log`, {
      action: mutation.payload.action,
      note: mutation.payload.note
    });
    return;
  }

  await api.patch(`/reminders/${mutation.payload.reminderId}`, mutation.payload.data);
}

export async function flushOfflineQueue() {
  if (syncInProgress) {
    return { synced: 0, remaining: (await readQueueFromStorage()).length };
  }

  const token = await getAuthToken();

  if (!token) {
    return { synced: 0, remaining: (await readQueueFromStorage()).length };
  }

  syncInProgress = true;

  try {
    const queue = await readQueueFromStorage();
    const remaining: OfflineMutation[] = [];
    let synced = 0;

    for (const mutation of queue) {
      try {
        await performQueuedMutation(mutation);
        synced += 1;
      } catch (error: any) {
        const status = error?.response?.status;
        const retryable = isApiNetworkError(error) || !status || status >= 500 || status === 401;
        const updatedMutation = {
          ...mutation,
          attempts: mutation.attempts + 1,
          lastError: error?.response?.data?.message || error?.message || "Falha ao sincronizar."
        };

        if (retryable) {
          remaining.push(updatedMutation);
          remaining.push(...queue.slice(queue.indexOf(mutation) + 1));
          break;
        }
      }
    }

    await writeQueueToStorage(remaining);
    return { synced, remaining: remaining.length };
  } finally {
    syncInProgress = false;
  }
}

