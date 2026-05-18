import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function notificationsRoutes(app: FastifyInstance) {
  // GET /notifications/preferences — retorna preferências do usuário
  app.get("/preferences", {
    preHandler: [app.authenticate]
  }, async (request) => {
    const userId = request.user.sub;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });

    return { preferences: pref };
  });

  // PATCH /notifications/preferences — atualiza preferências
  app.patch("/preferences", {
    preHandler: [app.authenticate]
  }, async (request) => {
    const bodySchema = z.object({
      chatNotificationsEnabled: z.boolean()
    });

    const userId = request.user.sub;
    const data = bodySchema.parse(request.body);

    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    });

    return { preferences: pref };
  });
}
