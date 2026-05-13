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
  progress?: ScheduleProgress;
};

export type ScheduleProgress = {
  total: number;
  done: number;
  skipped: number;
  missed: number;
  snoozed: number;
  pending: number;
  completionRate: number;
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

export type DashboardMetrics = {
  summary: {
    totalSchedules: number;
    activeSchedules: number;
    totalReminders: number;
    dueReminders: number;
    doneReminders: number;
    pendingReminders: number;
    overdueReminders?: number;
    skippedReminders: number;
    missedReminders: number;
    snoozedReminders: number;
    completionRate: number;
    routineProgressRate: number;
    aiSchedules: number;
    aiAdoptionRate: number;
    streakDays: number;
    bestCategory: string | null;
  };
  weekly: Array<{
    date: string;
    label: string;
    total: number;
    done: number;
    skipped: number;
    missed: number;
    completionRate: number;
  }>;
  categories: Array<{
    category: ScheduleCategory;
    label: string;
    schedules: number;
    reminders: number;
    done: number;
    completionRate: number;
  }>;
  priorities: Array<{
    priority: string;
    label: string;
    total: number;
    done: number;
    completionRate: number;
  }>;
  insights: string[];
};
