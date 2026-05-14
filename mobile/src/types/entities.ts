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
};

export type ReminderSuggestion = {
  title: string;
  description?: string | null;
  date: string;
  time: string;
  timezone?: string;
};

export type ScheduleSuggestion = {
  title: string;
  description?: string | null;
  category: ScheduleCategory;
  sourceType?: "AI_PROMPT" | "MANUAL" | "MEDICAL_IMAGE" | "IMPORTED_TEXT";
  confidence?: number;
  warnings?: string[];
  reminders: ReminderSuggestion[];
};
