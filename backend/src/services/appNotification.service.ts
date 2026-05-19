import { AppNotificationType } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export interface CreateAppNotificationOpts {
  userId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createAppNotification(opts: CreateAppNotificationOpts): Promise<void> {
  await prisma.appNotification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data ? JSON.stringify(opts.data) : null
    }
  });
}

export async function createAppNotificationBatch(notifications: CreateAppNotificationOpts[]): Promise<void> {
  if (notifications.length === 0) return;

  await prisma.appNotification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data ? JSON.stringify(n.data) : null
    }))
  });
}
