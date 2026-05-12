import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import { generateScheduleSuggestion } from "../services/ai-provider.service";
import {
  aiConfirmRequestSchema,
  aiSuggestRequestSchema,
  scheduleSuggestionSchema
} from "../services/scheduleSuggestion.schema";

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

export async function iaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/schedules/suggest", async (request, reply) => {
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
      request.log.error(error);

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
        message.includes("JSON") ||
        message.includes("Unexpected token") ||
        message.includes("Unterminated string") ||
        message.includes("A IA não retornou conteúdo")
      ) {
        return reply.status(502).send({
          message:
            "A IA não conseguiu gerar uma sugestão válida no momento. Tente novamente com um pedido mais objetivo.",
          code: "GEMINI_GENERATION_FAILED",
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
          title: suggestion.title,
          description: suggestion.description || undefined,
          notes: suggestion.notes || undefined,
          linksJson: normalizeLinks(suggestion.links),
          extraInfo: suggestion.extraInfo || undefined,
          category: suggestion.category,
          sourceType: "AI_PROMPT",
          reminders: {
            create: suggestion.reminders.map((reminder) => ({
              title: reminder.title,
              description: reminder.description || undefined,
              notes: reminder.notes || undefined,
              linksJson: normalizeLinks(reminder.links),
              location: reminder.location || undefined,
              priority: reminder.priority || "NORMAL",
              startAt: buildStartAt(reminder.date, reminder.time),
              timezone: reminder.timezone
            }))
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
        schedule
      });
    } catch (error: any) {
      request.log.error(error);

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
}