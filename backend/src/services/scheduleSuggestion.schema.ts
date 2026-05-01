import { z } from "zod";

export const reminderSuggestionSchema = z.object({
  title: z.string().min(1, "Título do lembrete é obrigatório."),
  description: z.string().optional().nullable(),
  date: z.string().min(10, "Data deve estar no formato YYYY-MM-DD."),
  time: z.string().min(5, "Hora deve estar no formato HH:mm."),
  timezone: z.string().default("America/Sao_Paulo")
});

export const scheduleSuggestionSchema = z.object({
  title: z.string().min(1, "Título do cronograma é obrigatório."),
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

  sourceType: z.enum([
    "AI_PROMPT"
  ]).default("AI_PROMPT"),

  confidence: z.number().min(0).max(1).default(0.7),

  warnings: z.array(z.string()).default([]),

  reminders: z
    .array(reminderSuggestionSchema)
    .min(1, "A IA precisa gerar pelo menos um lembrete.")
    .max(24, "A IA pode gerar no máximo 24 lembretes por vez.")
});

export const aiSuggestRequestSchema = z.object({
  prompt: z.string().min(5, "Prompt muito curto."),
  startDate: z.string().min(10, "Data inicial obrigatória."),
  timezone: z.string().default("America/Sao_Paulo")
});

export const aiConfirmRequestSchema = z.object({
  suggestion: scheduleSuggestionSchema
});

export type ReminderSuggestion = z.infer<typeof reminderSuggestionSchema>;
export type ScheduleSuggestion = z.infer<typeof scheduleSuggestionSchema>;
export type AiSuggestRequest = z.infer<typeof aiSuggestRequestSchema>;
export type AiConfirmRequest = z.infer<typeof aiConfirmRequestSchema>;