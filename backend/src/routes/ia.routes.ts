import { FastifyInstance } from "fastify";
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

export async function iaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/schedules/suggest", async (request, reply) => {
    const { prompt, startDate, timezone } = aiSuggestRequestSchema.parse(
      request.body
    );

    try {
      const suggestion = await generateScheduleSuggestion({
        prompt,
        startDate,
        timezone
      });

      const parsedSuggestion = scheduleSuggestionSchema.parse(suggestion);

      return {
        suggestion: parsedSuggestion
      };
    } catch (error: any) {
      request.log.error(error);

      const message = String(error?.message || "");

      if (
        message.includes("Ollama") ||
        message.includes("model requires more system memory") ||
        message.includes("Unterminated string in JSON")
      ) {
        return reply.status(502).send({
          message:
            "Não foi possível gerar o cronograma com a IA local. Verifique se o Ollama está rodando, se o modelo está correto e tente um prompt menor.",
          code: "OLLAMA_GENERATION_FAILED",
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
    const userId = request.user.sub;

    const { suggestion } = aiConfirmRequestSchema.parse(request.body);

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        title: suggestion.title,
        description: suggestion.description || undefined,
        category: suggestion.category,
        sourceType: "AI_PROMPT",
        reminders: {
          create: suggestion.reminders.map((reminder) => ({
            title: reminder.title,
            description: reminder.description || undefined,
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
  });
}