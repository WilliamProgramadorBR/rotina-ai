import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function schedulesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request) => {
    const userId = request.user.sub;

    const schedules = await prisma.schedule.findMany({
      where: {
        userId
      },
      include: {
        reminders: {
          orderBy: {
            startAt: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      schedules
    };
  });

  app.post("/", async (request, reply) => {
    const bodySchema = z.object({
      title: z.string().min(2),
      description: z.string().optional(),
      category: z
        .enum([
          "HEALTH",
          "STUDY",
          "WORKOUT",
          "WORK",
          "SLEEP",
          "WATER",
          "PERSONAL",
          "OTHER"
        ])
        .optional(),
      sourceType: z
        .enum([
          "MANUAL",
          "AI_PROMPT",
          "MEDICAL_IMAGE",
          "IMPORTED_TEXT"
        ])
        .optional()
    });

    const userId = request.user.sub;
    const data = bodySchema.parse(request.body);

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        category: data.category || "OTHER",
        sourceType: data.sourceType || "MANUAL"
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

  app.get("/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user.sub;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        userId
      },
      include: {
        reminders: {
          orderBy: {
            startAt: "asc"
          }
        }
      }
    });

    if (!schedule) {
      return reply.status(404).send({
        message: "Cronograma não encontrado."
      });
    }

    return {
      schedule
    };
  });

  app.delete("/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string()
    });

    const { id } = paramsSchema.parse(request.params);
    const userId = request.user.sub;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!schedule) {
      return reply.status(404).send({
        message: "Cronograma não encontrado."
      });
    }

    await prisma.schedule.delete({
      where: {
        id
      }
    });

    return {
      message: "Cronograma removido com sucesso."
    };
  });
}