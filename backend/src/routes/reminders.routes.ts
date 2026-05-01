import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";


export async function remindersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/today", async (request) => {
    const userId = request.user.sub;

    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const reminders = await prisma.reminder.findMany({
      where: {
        schedule: {
          userId
        },
        status: "ACTIVE",
        startAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        schedule: true,
        logs: {
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        startAt: "asc"
      }
    });

    return {
      reminders
    };
  });

  app.post("/", async (request, reply) => {
    const bodySchema = z.object({
      scheduleId: z.string(),
      title: z.string().min(2),
      description: z.string().optional(),
      startAt: z.string().datetime(),
      endAt: z.string().datetime().optional(),
      recurrenceRule: z.string().optional(),
      timezone: z.string().default("America/Sao_Paulo")
    });

    const userId = request.user.sub;
    const data = bodySchema.parse(request.body);

    const schedule = await prisma.schedule.findFirst({
      where: {
        id: data.scheduleId,
        userId
      }
    });

    if (!schedule) {
      return reply.status(404).send({
        message: "Cronograma não encontrado."
      });
    }

    const reminder = await prisma.reminder.create({
      data: {
        scheduleId: data.scheduleId,
        title: data.title,
        description: data.description,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        recurrenceRule: data.recurrenceRule,
        timezone: data.timezone
      }
    });

    return reply.status(201).send({
      reminder
    });
  });

  app.post("/:id/log", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const bodySchema = z.object({
     action: z.enum([
            "DONE",
            "SNOOZED",
            "SKIPPED",
            "MISSED"
            ]),
      note: z.string().optional()
    });

    const { id } = paramsSchema.parse(request.params);
    const { action, note } = bodySchema.parse(request.body);
    const userId = request.user.sub;

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        schedule: {
          userId
        }
      }
    });

    if (!reminder) {
      return reply.status(404).send({
        message: "Lembrete não encontrado."
      });
    }

    const log = await prisma.reminderLog.create({
      data: {
        userId,
        reminderId: id,
        action,
        note
      }
    });

    return reply.status(201).send({
      log
    });
  });

  app.patch("/:id/status", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const bodySchema = z.object({
   status: z.enum([
        "ACTIVE",
        "PAUSED",
        "FINISHED",
        "CANCELED"
        ])
    });

    const { id } = paramsSchema.parse(request.params);
    const { status } = bodySchema.parse(request.body);
    const userId = request.user.sub;

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        schedule: {
          userId
        }
      }
    });

    if (!reminder) {
      return reply.status(404).send({
        message: "Lembrete não encontrado."
      });
    }

    const updatedReminder = await prisma.reminder.update({
      where: {
        id
      },
      data: {
        status
      }
    });

    return {
      reminder: updatedReminder
    };
  });
}