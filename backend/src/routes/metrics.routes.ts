import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { buildDashboardMetrics } from "../services/metrics.service";

export async function metricsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/dashboard", async (request) => {
    const userId = request.user.sub;

    const schedules = await prisma.schedule.findMany({
      where: {
        userId
      },
      include: {
        reminders: {
          include: {
            logs: {
              orderBy: {
                createdAt: "desc"
              }
            }
          },
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
      metrics: buildDashboardMetrics(schedules)
    };
  });
}
