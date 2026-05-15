import { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import { prisma } from "../lib/prisma";
import { generateScheduleSuggestion } from "../services/ai-provider.service";
import {
  decryptReminder,
  decryptSchedule,
  encryptReminderData,
  encryptScheduleData
} from "../services/privateData.service";
import {
  aiConfirmRequestSchema,
  aiSuggestRequestSchema,
  scheduleSuggestionSchema
} from "../services/scheduleSuggestion.schema";
import { createRateLimitPreHandler, getClientIp } from "../security/rateLimit";

const rescheduleRequestSchema = z.object({
  reminderId: z.string(),
  title: z.string(),
  originalTime: z.string()
});

const rescheduleConfirmSchema = z.object({
  reminderId: z.string(),
  newTime: z.string().datetime()
});

function buildStartAt(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function normalizeLinks(links?: string[]) {
  if (!links || links.length === 0) {
    return undefined;
  }

  const cleanedLinks = links
    .map((link) => link.trim())
    .filter(Boolean);

  if (cleanedLinks.length === 0) {
    return undefined;
  }

  return JSON.stringify(cleanedLinks);
}

const aiRateLimit = createRateLimitPreHandler({
  scope: "ai",
  max: 10,
  windowMs: 60_000,
  keyFn: (req) => {
    const userId = (req as any).user?.sub;
    return userId ? `user:${userId}` : getClientIp(req);
  }
});

export async function iaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/schedules/suggest", { preHandler: [aiRateLimit] }, async (request, reply) => {
    try {
      const { prompt, startDate, timezone } = aiSuggestRequestSchema.parse(
        request.body
      );

      const suggestion = await generateScheduleSuggestion({
        prompt,
        startDate,
        timezone
      });

      const parsedSuggestion = scheduleSuggestionSchema.parse(suggestion);

      console.log("[AI SUGGESTION OK]", {
        title: parsedSuggestion.title,
        category: parsedSuggestion.category,
        reminders: parsedSuggestion.reminders.length,
        hasNotes: Boolean(parsedSuggestion.notes),
        hasExtraInfo: Boolean(parsedSuggestion.extraInfo)
      });

      return reply.status(200).send({
        suggestion: parsedSuggestion
      });
    } catch (error: any) {
      request.log.error({ msg: String(error?.message || "").slice(0, 500), name: error?.name, code: error?.code });

      if (error instanceof ZodError) {
        return reply.status(422).send({
          message:
            "A IA gerou uma estrutura inválida. O JSON veio, mas não bateu com o schema esperado.",
          code: "AI_SCHEMA_VALIDATION_FAILED",
          issues: error.issues
        });
      }

      const message = String(error?.message || "");

      if (
        message.includes("Timeout ao chamar Gemini") ||
        message.includes("Erro ao chamar Gemini") ||
        message.includes("Gemini") ||
        message.includes("Hugging Face") ||
        message.includes("HUGGINGFACE") ||
        message.includes("Ollama") ||
        message.includes("Todos os provedores de IA falharam") ||
        message.includes("JSON") ||
        message.includes("Unexpected token") ||
        message.includes("Unterminated string") ||
        message.includes("A IA não retornou conteúdo")
      ) {
        return reply.status(502).send({
          message:
            "A IA não conseguiu gerar uma sugestão válida no momento. Tente novamente com um pedido mais objetivo.",
          code: "AI_GENERATION_FAILED",
          detail: message
        });
      }

      return reply.status(500).send({
        message: "Não foi possível gerar o cronograma com IA.",
        code: "AI_GENERATION_FAILED",
        detail: message
      });
    }
  });

  app.post("/schedules/confirm", async (request, reply) => {
    try {
      const userId = request.user.sub;

      const { suggestion } = aiConfirmRequestSchema.parse(request.body);

      const schedule = await prisma.schedule.create({
        data: {
          userId,
          ...encryptScheduleData({
            title: suggestion.title,
            description: suggestion.description || undefined,
            notes: suggestion.notes || undefined,
            linksJson: normalizeLinks(suggestion.links),
            extraInfo: suggestion.extraInfo || undefined
          }),
          category: suggestion.category,
          sourceType: "AI_PROMPT",
          reminders: {
            create: suggestion.reminders.map((reminder) =>
              encryptReminderData({
                title: reminder.title,
                description: reminder.description || undefined,
                notes: reminder.notes || undefined,
                linksJson: normalizeLinks(reminder.links),
                location: reminder.location || undefined,
                priority: reminder.priority || "NORMAL",
                startAt: buildStartAt(reminder.date, reminder.time),
                timezone: reminder.timezone
              })
            )
          }
        },
        include: {
          reminders: {
            orderBy: {
              startAt: "asc"
            }
          }
        }
      });

      return reply.status(201).send({
        schedule: decryptSchedule(schedule)
      });
    } catch (error: any) {
      request.log.error({ msg: String(error?.message || "").slice(0, 500), name: error?.name, code: error?.code });

      if (error instanceof ZodError) {
        return reply.status(422).send({
          message: "Sugestão inválida para confirmação.",
          code: "AI_CONFIRM_SCHEMA_VALIDATION_FAILED",
          issues: error.issues
        });
      }

      return reply.status(500).send({
        message: "Não foi possível confirmar e salvar o cronograma.",
        code: "AI_CONFIRM_FAILED",
        detail: String(error?.message || "")
      });
    }
  });

  app.post("/reschedule", async (request, reply) => {
    try {
      const { reminderId, title, originalTime } = rescheduleRequestSchema.parse(request.body);

      const original = new Date(originalTime);
      const now = new Date();

      const laterToday = new Date(now);
      laterToday.setMinutes(laterToday.getMinutes() + 60);

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(original.getHours(), original.getMinutes(), 0, 0);

      const fmtTime = (d: Date) =>
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      const fmtDate = (d: Date) =>
        d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });

      const suggestedTime = laterToday < new Date(now.setHours(23, 0))
        ? `hoje às ${fmtTime(laterToday)}`
        : `amanhã às ${fmtTime(tomorrow)} (${fmtDate(tomorrow)})`;

      const suggestedDate = laterToday < new Date(now.setHours(23, 0)) ? laterToday : tomorrow;

      return reply.status(200).send({
        suggestion: {
          reminderId,
          title,
          originalTime,
          suggestedTime,
          suggestedTimeIso: suggestedDate.toISOString(),
          reason: "Horário sugerido com base no seu dia atual para manter a atividade dentro do dia ou no próximo dia útil."
        }
      });
    } catch (error: any) {
      request.log.error({ msg: String(error?.message || "").slice(0, 500), name: error?.name, code: error?.code });
      return reply.status(500).send({ message: "Não foi possível sugerir um novo horário.", code: "RESCHEDULE_FAILED" });
    }
  });

  app.post("/reschedule/confirm", async (request, reply) => {
    try {
      const userId = request.user.sub;
      const { reminderId, newTime } = rescheduleConfirmSchema.parse(request.body);

      const reminder = await prisma.reminder.findFirst({
        where: { id: reminderId, schedule: { userId } }
      });

      if (!reminder) {
        return reply.status(404).send({ message: "Lembrete não encontrado." });
      }

      const updated = await prisma.reminder.update({
        where: { id: reminderId },
        data: { startAt: new Date(newTime) }
      });

      return reply.status(200).send({ reminder: decryptReminder(updated) });
    } catch (error: any) {
      request.log.error({ msg: String(error?.message || "").slice(0, 500), name: error?.name, code: error?.code });
      return reply.status(500).send({ message: "Não foi possível confirmar o reagendamento.", code: "RESCHEDULE_CONFIRM_FAILED" });
    }
  });
}
