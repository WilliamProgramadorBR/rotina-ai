import { decryptText, encryptText, isEncryptedValue } from "./fieldCrypto.service";

type AnyRecord = Record<string, any>;

const scheduleFields = ["title", "description", "notes", "linksJson", "extraInfo"] as const;
const reminderFields = [
  "title",
  "description",
  "notes",
  "linksJson",
  "location",
  "recurrenceRule"
] as const;
const reminderLogFields = ["note"] as const;
const aiRequestFields = ["prompt", "imageUrl", "aiResponseJson"] as const;

function transformFields<T extends AnyRecord | null | undefined>(
  record: T,
  fields: readonly string[],
  transform: <V extends string | null | undefined>(value: V) => V
): T {
  if (!record) {
    return record;
  }

  const transformed = { ...record };

  for (const field of fields) {
    if (field in transformed) {
      transformed[field] = transform(transformed[field]);
    }
  }

  return transformed;
}

export function encryptScheduleData<T extends AnyRecord>(data: T): T {
  return transformFields(data, scheduleFields, encryptText);
}

export function encryptReminderData<T extends AnyRecord>(data: T): T {
  return transformFields(data, reminderFields, encryptText);
}

export function encryptReminderLogData<T extends AnyRecord>(data: T): T {
  return transformFields(data, reminderLogFields, encryptText);
}

export function encryptAiRequestData<T extends AnyRecord>(data: T): T {
  return transformFields(data, aiRequestFields, encryptText);
}

export function decryptReminderLog<T extends AnyRecord | null | undefined>(log: T): T {
  return transformFields(log, reminderLogFields, decryptText);
}

export function decryptReminder<T extends AnyRecord | null | undefined>(reminder: T): T {
  const decrypted = transformFields(reminder, reminderFields, decryptText);

  if (!decrypted) {
    return decrypted;
  }

  if (Array.isArray(decrypted.logs)) {
    decrypted.logs = decrypted.logs.map(decryptReminderLog);
  }

  if (decrypted.schedule) {
    decrypted.schedule = decryptSchedule(decrypted.schedule);
  }

  return decrypted;
}

export function decryptSchedule<T extends AnyRecord | null | undefined>(schedule: T): T {
  const decrypted = transformFields(schedule, scheduleFields, decryptText);

  if (!decrypted) {
    return decrypted;
  }

  if (Array.isArray(decrypted.reminders)) {
    decrypted.reminders = decrypted.reminders.map(decryptReminder);
  }

  return decrypted;
}

export function decryptSchedules<T extends AnyRecord>(schedules: T[]) {
  return schedules.map(decryptSchedule);
}

export function decryptReminders<T extends AnyRecord>(reminders: T[]) {
  return reminders.map(decryptReminder);
}

export function hasEncryptedPrivateFields(record: AnyRecord) {
  return [...scheduleFields, ...reminderFields, ...reminderLogFields, ...aiRequestFields]
    .some((field) => isEncryptedValue(record[field]));
}
