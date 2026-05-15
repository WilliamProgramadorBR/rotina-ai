export type ScheduleCategory =
  | "HEALTH"
  | "STUDY"
  | "WORKOUT"
  | "WORK"
  | "SLEEP"
  | "WATER"
  | "PERSONAL"
  | "OTHER";

export type ReminderLog = {
  id: string;
  action: "DONE" | "SNOOZED" | "SKIPPED" | "MISSED";
  note?: string | null;
  createdAt: string;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type Schedule = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  linksJson?: string | null;
  extraInfo?: string | null;
  category: ScheduleCategory;
  sourceType?: "MANUAL" | "AI_PROMPT" | "MEDICAL_IMAGE" | "IMPORTED_TEXT";
  reminders?: Reminder[];
  progress?: {
    total: number;
    done: number;
    skipped: number;
    missed: number;
    snoozed: number;
    pending: number;
    completionRate: number;
  };
  groupId?: string | null;
};

export type Reminder = {
  id: string;
  scheduleId?: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  linksJson?: string | null;
  location?: string | null;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | string | null;
  alarmLevel?: "LEVE" | "IMPORTANTE" | "CRITICO" | "ROTINA" | string | null;
  startAt: string;
  endAt?: string | null;
  recurrenceRule?: string | null;
  timezone?: string;
  status?: "ACTIVE" | "PAUSED" | "FINISHED" | "CANCELED";
  schedule?: Schedule;
  logs?: ReminderLog[];
  assignedUserId?: string | null;
  assignedUser?: UserSummary | null;
};

export type ReminderSuggestion = {
  title: string;
  description?: string | null;
  notes?: string | null;
  links?: string[];
  location?: string | null;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  date: string;
  time: string;
  timezone?: string;
};

export type ScheduleSuggestion = {
  title: string;
  description?: string | null;
  notes?: string | null;
  links?: string[];
  extraInfo?: string | null;
  category: ScheduleCategory;
  sourceType?: "AI_PROMPT" | "MANUAL" | "MEDICAL_IMAGE" | "IMPORTED_TEXT";
  confidence?: number;
  warnings?: string[];
  reminders: ReminderSuggestion[];
};

export type CollaborationRole = "OWNER" | "ADMIN" | "MEMBER";
export type CollaborationInviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELED";

export type CollaborationMember = {
  id: string;
  groupId: string;
  userId: string;
  role: CollaborationRole;
  joinedAt: string;
  user: UserSummary;
};

export type CollaborationInvite = {
  id: string;
  groupId: string;
  email: string;
  invitedById: string;
  invitedUserId?: string | null;
  status: CollaborationInviteStatus;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string | null;
  invitedBy?: UserSummary;
  invitedUser?: UserSummary | null;
  group?: CollaborationGroup;
};

export type CollaborationGroup = {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary;
  members?: CollaborationMember[];
  invites?: CollaborationInvite[];
  schedules?: Schedule[];
};
