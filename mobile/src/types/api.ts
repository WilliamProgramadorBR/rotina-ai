export type ScheduleCategory =
  | "HEALTH"
  | "STUDY"
  | "WORKOUT"
  | "WORK"
  | "SLEEP"
  | "WATER"
  | "PERSONAL"
  | "OTHER";

export type ScheduleSourceType =
  | "MANUAL"
  | "AI_PROMPT"
  | "MEDICAL_IMAGE"
  | "IMPORTED_TEXT";

export type ReminderStatus = "ACTIVE" | "PAUSED" | "FINISHED" | "CANCELED";

export type ReminderAction = "DONE" | "SNOOZED" | "SKIPPED" | "MISSED";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type Schedule = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  category: ScheduleCategory;
  sourceType: ScheduleSourceType;
  createdAt: string;
  updatedAt: string;
  reminders?: Reminder[];
};

export type ReminderLog = {
  id: string;
  userId: string;
  reminderId: string;
  action: ReminderAction;
  note?: string | null;
  createdAt: string;
};

export type Reminder = {
  id: string;
  scheduleId: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  recurrenceRule?: string | null;
  timezone: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  schedule?: Schedule;
  logs?: ReminderLog[];
};
