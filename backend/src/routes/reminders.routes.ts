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

const alarmLevelSchema = z.enum([
  "LEVE",
  "IMPORTANTE",
  "CRITICO",
  "ROTINA"
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

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true
};

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

function normalizePatchLinks(links?: string[] | null) {
  if (typeof links === "undefined") {
    return undefined;
  }

  if (!links || links.length === 0) {
    return null;
  }

  const cleanedLinks = links
    .map((link) => link.trim())
    .filter(Boolean);

  if (cleanedLinks.length === 0) {
    return null;
  }

  return JSON.stringify(cleanedLinks);
}

function hasField<T extends object>(data: T, field: keyof T) {
  return Object.prototype.hasOwnProperty.call(data, field);
}

function accessibleScheduleWhere(userId: string) {
  return {
    OR: [
      {
        userId
      },
      {
        group: {
          members: {
            some: {
              userId
            }
          }
        }
      }
    ]
  };
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
          ...accessibleScheduleWhere(userId)
        },
        startAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        schedule: true,
        logs: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        comments: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
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
          ...accessibleScheduleWhere(userId)
        },
        status: "ACTIVE",
        startAt: {
          lte: endOfDay
        }
      },
      include: {
        schedule: true,
        logs: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        comments: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
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
      title: z.string().min(2).max(80),
      description: z.string().max(300).optional(),

      notes: z.string().max(500).optional(),
      links: z.array(z.string().max(500)).max(20).optional(),
      location: z.string().max(200).optional(),
      priority: reminderPrioritySchema.optional(),
      alarmLevel: alarmLevelSchema.optional(),

      startAt: z.string().datetime(),
      endAt: z.string().datetime().optional(),
      recurrenceRule: z.string().max(200).optional(),
      timezone: z.string().max(60).default("America/Sao_Paulo")
    });

    const userId = request.user.sub;
    const data = bodySchema.parse(request.body);

    const schedule = await prisma.schedule.findFirst({
      where: {
        id: data.scheduleId,
        ...accessibleScheduleWhere(userId)
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
        alarmLevel: data.alarmLevel || "IMPORTANTE",

        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        recurrenceRule: data.recurrenceRule,
        timezone: data.timezone
      }),
      include: {
        schedule: true,
        logs: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        comments: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
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

  app.patch("/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const bodySchema = z.object({
      title: z.string().min(2).max(80).optional(),
      description: z.string().max(300).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
      links: z.array(z.string().max(500)).max(20).nullable().optional(),
      location: z.string().max(200).nullable().optional(),
      priority: reminderPrioritySchema.nullable().optional(),
      alarmLevel: alarmLevelSchema.optional(),
      startAt: z.string().datetime().optional(),
      endAt: z.string().datetime().nullable().optional(),
      recurrenceRule: z.string().max(200).nullable().optional(),
      timezone: z.string().max(60).optional()
    }).refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo para atualizar."
    });

    const { id } = paramsSchema.parse(request.params);
    const data = bodySchema.parse(request.body);
    const userId = request.user.sub;

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        schedule: {
          ...accessibleScheduleWhere(userId)
        }
      }
    });

    if (!reminder) {
      return reply.status(404).send({
        message: "Lembrete nÃ£o encontrado."
      });
    }

    const updateData: Record<string, any> = {};

    if (hasField(data, "title")) updateData.title = data.title?.trim();
    if (hasField(data, "description")) updateData.description = data.description?.trim() || null;
    if (hasField(data, "notes")) updateData.notes = data.notes?.trim() || null;
    if (hasField(data, "links")) updateData.linksJson = normalizePatchLinks(data.links);
    if (hasField(data, "location")) updateData.location = data.location?.trim() || null;
    if (hasField(data, "priority")) updateData.priority = data.priority || "NORMAL";
    if (hasField(data, "alarmLevel")) updateData.alarmLevel = data.alarmLevel;
    if (hasField(data, "startAt") && data.startAt) updateData.startAt = new Date(data.startAt);
    if (hasField(data, "endAt")) updateData.endAt = data.endAt ? new Date(data.endAt) : null;
    if (hasField(data, "recurrenceRule")) updateData.recurrenceRule = data.recurrenceRule?.trim() || null;
    if (hasField(data, "timezone")) updateData.timezone = data.timezone?.trim() || "America/Sao_Paulo";

    const updatedReminder = await prisma.reminder.update({
      where: {
        id
      },
      data: encryptReminderData(updateData),
      include: {
        schedule: true,
        logs: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        comments: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
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

  app.post("/:id/log", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const bodySchema = z.object({
      action: reminderActionSchema,
      note: z.string().max(500).optional()
    });

    const { id } = paramsSchema.parse(request.params);
    const { action, note } = bodySchema.parse(request.body);
    const userId = request.user.sub;

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        schedule: {
          ...accessibleScheduleWhere(userId)
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
      }),
      include: {
        user: {
          select: userSummarySelect
        }
      }
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
          ...accessibleScheduleWhere(userId)
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
          include: {
            user: {
              select: userSummarySelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        comments: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
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
