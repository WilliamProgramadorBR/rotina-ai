import { z } from "zod";

export const reminderSuggestionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date deve estar em YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "time deve estar em HH:mm"),
  timezone: z.string().default("America/Sao_Paulo")
});

export const scheduleSuggestionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.enum([
    "HEALTH",
    "STUDY",
    "WORKOUT",
    "WORK",
    "SLEEP",
    "WATER",
    "PERSONAL",
    "OTHER"
  ]),
  sourceType: z.literal("AI_PROMPT").default("AI_PROMPT"),
  confidence: z.number().min(0).max(1).default(0.5),
  warnings: z.array(z.string()).default([]),
  reminders: z.array(reminderSuggestionSchema).min(1).max(60)
});

export const aiSuggestRequestSchema = z.object({
  prompt: z.string().min(5, "Descreva melhor o cronograma que deseja criar."),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().default("America/Sao_Paulo")
});

export const aiConfirmRequestSchema = z.object({
  suggestion: scheduleSuggestionSchema
});

export type ScheduleSuggestion = z.infer<typeof scheduleSuggestionSchema>;
export type ReminderSuggestion = z.infer<typeof reminderSuggestionSchema>;
