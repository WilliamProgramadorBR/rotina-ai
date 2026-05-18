import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import {
  buildCollaborationDashboardMetrics,
  buildDashboardMetrics
} from "../services/metrics.service";
import { decryptCollaborationGroups } from "../services/privateData.service";

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true
};

export async function metricsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/dashboard", async (request) => {
    const userId = request.user.sub;

    const schedules = await prisma.schedule.findMany({
      where: {
        userId,
        groupId: null
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

  app.get("/collaboration/dashboard", async (request) => {
    const userId = request.user.sub;

    const groups = await prisma.collaborationGroup.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: userSummarySelect
            }
          },
          orderBy: {
            joinedAt: "asc"
          }
        },
        schedules: {
          include: {
            reminders: {
              include: {
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
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return {
      metrics: buildCollaborationDashboardMetrics(decryptCollaborationGroups(groups))
    };
  });
}
