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
const reminderCommentFields = ["message"] as const;
const aiRequestFields = ["prompt", "imageUrl", "aiResponseJson"] as const;
const collaborationGroupFields = ["name", "description"] as const;
const collaborationInviteFields = ["message"] as const;
const collaborationMessageFields = ["message"] as const;

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

export function encryptReminderCommentData<T extends AnyRecord>(data: T): T {
  return transformFields(data, reminderCommentFields, encryptText);
}

export function encryptAiRequestData<T extends AnyRecord>(data: T): T {
  return transformFields(data, aiRequestFields, encryptText);
}

export function encryptCollaborationGroupData<T extends AnyRecord>(data: T): T {
  return transformFields(data, collaborationGroupFields, encryptText);
}

export function encryptCollaborationInviteData<T extends AnyRecord>(data: T): T {
  return transformFields(data, collaborationInviteFields, encryptText);
}

export function encryptCollaborationMessageData<T extends AnyRecord>(data: T): T {
  return transformFields(data, collaborationMessageFields, encryptText);
}

export function decryptReminderLog<T extends AnyRecord | null | undefined>(log: T): T {
  return transformFields(log, reminderLogFields, decryptText);
}

export function decryptReminderComment<T extends AnyRecord | null | undefined>(comment: T): T {
  return transformFields(comment, reminderCommentFields, decryptText);
}

export function decryptReminder<T extends AnyRecord | null | undefined>(reminder: T): T {
  const decrypted = transformFields(reminder, reminderFields, decryptText);

  if (!decrypted) {
    return decrypted;
  }

  if (Array.isArray(decrypted.logs)) {
    decrypted.logs = decrypted.logs.map(decryptReminderLog);
  }

  if (Array.isArray(decrypted.comments)) {
    decrypted.comments = decrypted.comments.map(decryptReminderComment);
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

export function decryptCollaborationInvite<T extends AnyRecord | null | undefined>(invite: T): T {
  const decrypted = transformFields(invite, collaborationInviteFields, decryptText);

  if (!decrypted) {
    return decrypted;
  }

  if (decrypted.group) {
    decrypted.group = decryptCollaborationGroup(decrypted.group);
  }

  return decrypted;
}

export function decryptCollaborationMessage<T extends AnyRecord | null | undefined>(message: T): T {
  return transformFields(message, collaborationMessageFields, decryptText);
}

export function decryptCollaborationMessages<T extends AnyRecord>(messages: T[]) {
  return messages.map(decryptCollaborationMessage);
}

export function decryptCollaborationGroup<T extends AnyRecord | null | undefined>(group: T): T {
  const decrypted = transformFields(group, collaborationGroupFields, decryptText);

  if (!decrypted) {
    return decrypted;
  }

  if (Array.isArray(decrypted.schedules)) {
    decrypted.schedules = decryptSchedules(decrypted.schedules);
  }

  if (Array.isArray(decrypted.invites)) {
    decrypted.invites = decrypted.invites.map(decryptCollaborationInvite);
  }

  return decrypted;
}

export function decryptCollaborationGroups<T extends AnyRecord>(groups: T[]) {
  return groups.map(decryptCollaborationGroup);
}

export function decryptCollaborationInvites<T extends AnyRecord>(invites: T[]) {
  return invites.map(decryptCollaborationInvite);
}

export function hasEncryptedPrivateFields(record: AnyRecord) {
  return [
    ...scheduleFields,
    ...reminderFields,
    ...reminderLogFields,
    ...reminderCommentFields,
    ...aiRequestFields,
    ...collaborationGroupFields,
    ...collaborationInviteFields,
    ...collaborationMessageFields
  ]
    .some((field) => isEncryptedValue(record[field]));
}
