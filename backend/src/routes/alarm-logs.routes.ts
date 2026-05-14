import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const createAlarmLogSchema = z.object({
  scheduleId: z.string().optional(),
  reminderId: z.string().optional(),
  alarmTime: z.string().datetime(),
  status: z.enum(["scheduled", "fired", "dismissed", "snoozed", "missed"]).default("scheduled")
});

const updateAlarmLogSchema = z.object({
  status: z.enum(["scheduled", "fired", "dismissed", "snoozed", "missed"])
});

export async function alarmLogsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/", async (request, reply) => {
    try {
      const userId = request.user.sub;
      const data = createAlarmLogSchema.parse(request.body);

      const log = await prisma.alarmLog.create({
        data: {
          userId,
          scheduleId: data.scheduleId,
          reminderId: data.reminderId,
          alarmTime: new Date(data.alarmTime),
          status: data.status
        }
      });

      return reply.status(201).send({ alarmLog: log });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Não foi possível registrar o log de alarme." });
    }
  });

  app.patch("/:id", async (request, reply) => {
    try {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const { status } = updateAlarmLogSchema.parse(request.body);

      const existing = await prisma.alarmLog.findFirst({ where: { id, userId } });
      if (!existing) {
        return reply.status(404).send({ message: "Log de alarme não encontrado." });
      }

      const updated = await prisma.alarmLog.update({
        where: { id },
        data: { status }
      });

      return reply.status(200).send({ alarmLog: updated });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Não foi possível atualizar o log de alarme." });
    }
  });

  app.get("/", async (request, reply) => {
    try {
      const userId = request.user.sub;
      const query = (request.query as any) || {};
      const limit = Math.min(Number(query.limit || 50), 200);
      const reminderId = query.reminderId as string | undefined;

      const logs = await prisma.alarmLog.findMany({
        where: { userId, ...(reminderId ? { reminderId } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit
      });

      return reply.status(200).send({ alarmLogs: logs, total: logs.length });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Não foi possível buscar os logs de alarme." });
    }
  });
}
