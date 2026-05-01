import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import {
  aiConfirmRequestSchema,
  aiSuggestRequestSchema,
  ScheduleSuggestion
} from "../services/scheduleSuggestion.schema";
import { generateScheduleSuggestionWithGemini } from "../services/gemini.service";

function toDateTimeWithTimezone(date: string, time: string) {
  // MVP: app focado inicialmente no Brasil. Mantemos -03:00 para salvar corretamente em UTC.
  // Futuro: usar uma lib de timezone para suportar usuários fora de America/Sao_Paulo.
  return new Date(`${date}T${time}:00-03:00`);
}

export async function aiRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/schedules/suggest", async (request, reply) => {
    const userId = request.user.sub;
    const body = aiSuggestRequestSchema.parse(request.body);

    const aiRequest = await prisma.aiRequest.create({
      data: {
        userId,
        inputType: "PROMPT",
        prompt: body.prompt,
        status: "PROCESSING"
      }
    });

    try {
      const suggestion = await generateScheduleSuggestionWithGemini({
        prompt: body.prompt,
        startDate: body.startDate,
        timezone: body.timezone
      });

      await prisma.aiRequest.update({
        where: { id: aiRequest.id },
        data: {
          status: "DONE",
          aiResponseJson: JSON.stringify(suggestion)
        }
      });

      return {
        suggestion,
        aiRequestId: aiRequest.id
      };
    } catch (error: any) {
      await prisma.aiRequest.update({
        where: { id: aiRequest.id },
        data: {
          status: "ERROR",
          aiResponseJson: JSON.stringify({ error: error?.message || "Erro desconhecido" })
        }
      });

      request.log.error(error);

      return reply.status(500).send({
        message: "Não foi possível gerar a sugestão com IA.",
        detail: error?.message || "Erro desconhecido"
      });
    }
  });

  app.post("/schedules/confirm", async (request, reply) => {
    const userId = request.user.sub;
    const { suggestion } = aiConfirmRequestSchema.parse(request.body);

    const result = await prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.create({
        data: {
          userId,
          title: suggestion.title,
          description: suggestion.description || undefined,
          category: suggestion.category,
          sourceType: "AI_PROMPT"
        }
      });

      const remindersData = suggestion.reminders.map((reminder) => ({
        scheduleId: schedule.id,
        title: reminder.title,
        description: reminder.description || undefined,
        startAt: toDateTimeWithTimezone(reminder.date, reminder.time),
        timezone: reminder.timezone || "America/Sao_Paulo"
      }));

      await tx.reminder.createMany({
        data: remindersData
      });

      const reminders = await tx.reminder.findMany({
        where: { scheduleId: schedule.id },
        orderBy: { startAt: "asc" }
      });

      return {
        schedule,
        reminders
      };
    });

    return reply.status(201).send(result);
  });
}
