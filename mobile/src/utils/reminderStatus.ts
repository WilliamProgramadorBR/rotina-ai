type ReminderLogLike = {
  action: string;
  createdAt?: string | Date | null;
};

export type ReminderStatusLike = {
  startAt?: string | Date | null;
  status?: string | null;
  logs?: ReminderLogLike[];
};

const finishedActions = new Set(["DONE", "SKIPPED", "MISSED"]);

function toTimestamp(value?: string | Date | null) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getLatestReminderAction(reminder: ReminderStatusLike) {
  const logs = reminder.logs || [];

  if (logs.length === 0) {
    return null;
  }

  return [...logs].sort(
    (a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)
  )[0]?.action || null;
}

export function isReminderOpen(reminder: ReminderStatusLike) {
  if (reminder.status === "CANCELED" || reminder.status === "PAUSED") {
    return false;
  }

  const latestAction = getLatestReminderAction(reminder);

  return !latestAction || !finishedActions.has(latestAction);
}

export function isReminderDone(reminder: ReminderStatusLike) {
  return getLatestReminderAction(reminder) === "DONE";
}

export function isReminderSkipped(reminder: ReminderStatusLike) {
  return getLatestReminderAction(reminder) === "SKIPPED";
}

export function isReminderOverdue(reminder: ReminderStatusLike, now = Date.now()) {
  const startsAt = toTimestamp(reminder.startAt);

  return startsAt > 0 && startsAt < now && isReminderOpen(reminder);
}

export function countOverdueReminders(reminders: ReminderStatusLike[] = []) {
  return reminders.filter((reminder) => isReminderOverdue(reminder)).length;
}

export function formatOverdueLabel(value?: string | Date | null, now = Date.now()) {
  const startsAt = toTimestamp(value);

  if (startsAt <= 0 || startsAt >= now) {
    return "No horario";
  }

  const diffMinutes = Math.max(1, Math.floor((now - startsAt) / 60000));

  if (diffMinutes < 60) {
    return `Atrasado ha ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Atrasado ha ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `Atrasado ha ${diffDays}d`;
}
