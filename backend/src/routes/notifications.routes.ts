import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const PAGE_SIZE = 30;

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

  // GET /notifications — lista notificações in-app do usuário
  app.get("/", {
    preHandler: [app.authenticate]
  }, async (request) => {
    const querySchema = z.object({
      unreadOnly: z.coerce.boolean().optional().default(false),
      cursor: z.string().optional()
    });

    const userId = request.user.sub;
    const { unreadOnly, cursor } = querySchema.parse(request.query);

    const notifications = await prisma.appNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1
    });

    const hasMore = notifications.length > PAGE_SIZE;
    const items = hasMore ? notifications.slice(0, PAGE_SIZE) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    const unreadCount = await prisma.appNotification.count({
      where: { userId, readAt: null }
    });

    return {
      notifications: items.map((n) => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null
      })),
      unreadCount,
      nextCursor
    };
  });

  // PATCH /notifications/:id/read — marca uma notificação como lida
  app.patch("/:id/read", {
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() });
    const userId = request.user.sub;
    const { id } = paramsSchema.parse(request.params);

    const notification = await prisma.appNotification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return reply.status(404).send({ message: "Notificação não encontrada." });
    }

    const updated = await prisma.appNotification.update({
      where: { id },
      data: { readAt: new Date() }
    });

    return {
      notification: { ...updated, data: updated.data ? JSON.parse(updated.data) : null }
    };
  });

  // POST /notifications/read-all — marca todas como lidas
  app.post("/read-all", {
    preHandler: [app.authenticate]
  }, async (request) => {
    const userId = request.user.sub;

    await prisma.appNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });

    return { ok: true };
  });

  // GET /notifications/unread-count — badge rápido sem buscar itens
  app.get("/unread-count", {
    preHandler: [app.authenticate]
  }, async (request) => {
    const userId = request.user.sub;

    const count = await prisma.appNotification.count({
      where: { userId, readAt: null }
    });

    return { unreadCount: count };
  });
}
