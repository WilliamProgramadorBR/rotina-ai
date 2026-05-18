export type ScheduleCategory =
  | "HEALTH"
  | "STUDY"
  | "WORKOUT"
  | "WORK"
  | "SLEEP"
  | "WATER"
  | "PERSONAL"
  | "OTHER";

export type AlarmLevel = "LEVE" | "IMPORTANTE" | "CRITICO" | "ROTINA";

export type AlarmLogStatus = "scheduled" | "fired" | "dismissed" | "snoozed" | "missed";

export type AlarmLog = {
  id: string;
  userId: string;
  scheduleId?: string | null;
  reminderId?: string | null;
  alarmTime: string;
  status: AlarmLogStatus;
  createdAt: string;
};

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
  avatarUrl?: string | null;
  createdAt?: string;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type Schedule = {
  id: string;
  userId: string;
  groupId?: string | null;
  title: string;
  description?: string | null;
  notes?: string | null;
  linksJson?: string | null;
  extraInfo?: string | null;
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
  user?: UserSummary | null;
};

export type ReminderComment = {
  id: string;
  userId: string;
  reminderId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary | null;
};

export type Reminder = {
  id: string;
  scheduleId: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  linksJson?: string | null;
  startAt: string;
  endAt?: string | null;
  recurrenceRule?: string | null;
  timezone: string;
  status: ReminderStatus;
  alarmLevel?: AlarmLevel | null;
  priority?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
  schedule?: Schedule;
  logs?: ReminderLog[];
  comments?: ReminderComment[];
  assignedUserId?: string | null;
  assignedUser?: UserSummary | null;
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

export type CollaborationDashboardMetrics = DashboardMetrics & {
  summary: DashboardMetrics["summary"] & {
    totalGroups: number;
    activeGroups: number;
    totalComments: number;
  };
  groups: Array<{
    groupId: string;
    groupName: string;
    description?: string | null;
    members: number;
    schedules: number;
    comments: number;
    summary: DashboardMetrics["summary"];
    weekly: DashboardMetrics["weekly"];
    topContributors: Array<{
      userId: string;
      name: string;
      role: string;
      done: number;
    }>;
    insights: string[];
  }>;
};
