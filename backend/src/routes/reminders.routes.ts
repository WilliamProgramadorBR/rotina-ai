import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getLatestReminderAction } from "../services/metrics.service";
import {
  decryptReminder,
  decryptReminderLog,
  decryptReminders,
  encryptReminderData,
  encryptReminderLogData
} from "../services/privateData.service";

const reminderPrioritySchema = z.enum([
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL"
]);

const reminderStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "FINISHED",
  "CANCELED"
]);

const reminderActionSchema = z.enum([
  "DONE",
  "SNOOZED",
  "SKIPPED",
  "MISSED"
]);

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

export async function remindersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/range", async (request) => {
    const querySchema = z.object({
      start: z.string().min(10),
      end: z.string().min(10)
    });

    const userId = request.user.sub;
    const { start, end } = querySchema.parse(request.query);

    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T23:59:59`);

    const reminders = await prisma.reminder.findMany({
      where: {
        schedule: {
          userId
        },
        startAt: {
          gte: startDate,
          lte: endDate
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
      reminders: decryptReminders(reminders)
    };
  });

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
      reminders: decryptReminders(reminders.filter((reminder) => {
        const isToday = reminder.startAt >= startOfDay && reminder.startAt <= endOfDay;

        if (isToday) {
          return true;
        }

        const latestAction = getLatestReminderAction(reminder);

        return latestAction !== "DONE" && latestAction !== "SKIPPED" && latestAction !== "MISSED";
      }))
    };
  });

  app.post("/", async (request, reply) => {
    const bodySchema = z.object({
      scheduleId: z.string(),
      title: z.string().min(2),
      description: z.string().optional(),

      notes: z.string().optional(),
      links: z.array(z.string()).optional(),
      location: z.string().optional(),
      priority: reminderPrioritySchema.optional(),

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
      data: encryptReminderData({
        scheduleId: data.scheduleId,
        title: data.title,
        description: data.description,

        notes: data.notes,
        linksJson: normalizeLinks(data.links),
        location: data.location,
        priority: data.priority || "NORMAL",

        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        recurrenceRule: data.recurrenceRule,
        timezone: data.timezone
      }),
      include: {
        schedule: true,
        logs: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    return reply.status(201).send({
      reminder: decryptReminder(reminder)
    });
  });

  app.post("/:id/log", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const bodySchema = z.object({
      action: reminderActionSchema,
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
      data: encryptReminderLogData({
        userId,
        reminderId: id,
        action,
        note
      })
    });

    return reply.status(201).send({
      log: decryptReminderLog(log)
    });
  });

  app.patch("/:id/status", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const bodySchema = z.object({
      status: reminderStatusSchema
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
      },
      include: {
        schedule: true,
        logs: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    return {
      reminder: decryptReminder(updatedReminder)
    };
  });
}
