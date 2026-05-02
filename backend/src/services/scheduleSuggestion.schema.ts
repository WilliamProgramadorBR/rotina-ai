import { z } from "zod";

export const reminderSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  links: z.array(z.string()).default([]),
  location: z.string().optional().nullable(),
  priority: z
    .enum(["LOW", "NORMAL", "HIGH", "CRITICAL"])
    .default("NORMAL"),
  date: z.string().min(10),
  time: z.string().min(5),
  timezone: z.string().default("America/Sao_Paulo")
});

export const scheduleSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  links: z.array(z.string()).default([]),
  extraInfo: z.string().optional().nullable(),
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
  sourceType: z.enum(["AI_PROMPT"]).default("AI_PROMPT"),
  confidence: z.number().min(0).max(1).default(0.7),
  warnings: z.array(z.string()).default([]),
  reminders: z.array(reminderSuggestionSchema).min(1).max(24)
});

export const aiSuggestRequestSchema = z.object({
  prompt: z.string().min(5),
  startDate: z.string().min(10),
  timezone: z.string().default("America/Sao_Paulo")
});

export const aiConfirmRequestSchema = z.object({
  suggestion: scheduleSuggestionSchema
});

export type ReminderSuggestion = z.infer<typeof reminderSuggestionSchema>;
export type ScheduleSuggestion = z.infer<typeof scheduleSuggestionSchema>;
export type AiSuggestRequest = z.infer<typeof aiSuggestRequestSchema>;
export type AiConfirmRequest = z.infer<typeof aiConfirmRequestSchema>;