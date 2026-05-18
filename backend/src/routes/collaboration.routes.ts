import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { withScheduleProgress } from "../services/metrics.service";
import { generateScheduleSuggestion } from "../services/ai-provider.service";
import { sendExpoPushNotificationBatch, PushPayload } from "../services/pushNotification.service";
import {
  aiSuggestRequestSchema,
  scheduleSuggestionSchema
} from "../services/scheduleSuggestion.schema";
import {
  decryptCollaborationGroup,
  decryptCollaborationGroups,
  decryptCollaborationInvite,
  decryptCollaborationInvites,
  decryptCollaborationMessage,
  decryptCollaborationMessages,
  decryptReminderComment,
  decryptSchedule,
  encryptCollaborationGroupData,
  encryptCollaborationInviteData,
  encryptCollaborationMessageData,
  encryptReminderCommentData,
  encryptReminderData,
  encryptScheduleData
} from "../services/privateData.service";

const roleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
const ONLINE_WINDOW_MS = 90_000;

const groupBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional()
});

const inviteBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  message: z.string().trim().max(500).optional()
});

const scheduleBodySchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
  links: z.array(z.string().max(500)).max(20).optional(),
  extraInfo: z.string().trim().max(800).optional(),
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
    .optional()
});

const assignReminderSchema = z.object({
  assignedUserId: z.string().nullable()
});

const commentBodySchema = z.object({
  message: z.string().trim().min(1).max(800)
});

const chatMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(1200)
});

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

  const cleanedLinks = links.map((link) => link.trim()).filter(Boolean);

  return cleanedLinks.length > 0 ? JSON.stringify(cleanedLinks) : undefined;
}

function buildStartAt(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

async function findMembership(groupId: string, userId: string) {
  return prisma.collaborationMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    }
  });
}

async function requireMembership(groupId: string, userId: string, reply: any) {
  const membership = await findMembership(groupId, userId);

  if (!membership) {
    reply.status(404).send({
      message: "Grupo colaborativo nao encontrado."
    });
    return null;
  }

  return membership;
}

async function requireManager(groupId: string, userId: string, reply: any) {
  const membership = await requireMembership(groupId, userId, reply);

  if (!membership) {
    return null;
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    reply.status(403).send({
      message: "Voce nao tem permissao para gerenciar este grupo."
    });
    return null;
  }

  return membership;
}

async function touchPresence(groupId: string, userId: string) {
  const now = new Date();

  return prisma.collaborationPresence.upsert({
    where: {
      groupId_userId: {
        groupId,
        userId
      }
    },
    create: {
      groupId,
      userId,
      lastSeenAt: now
    },
    update: {
      lastSeenAt: now
    }
  });
}

async function buildPresenceSnapshot(groupId: string, currentUserId: string) {
  const [members, presences] = await Promise.all([
    prisma.collaborationMember.findMany({
      where: {
        groupId
      },
      include: {
        user: {
          select: userSummarySelect
        }
      },
      orderBy: {
        joinedAt: "asc"
      }
    }),
    prisma.collaborationPresence.findMany({
      where: {
        groupId
      }
    })
  ]);
  const presenceByUserId = new Map(presences.map((presence) => [presence.userId, presence]));
  const now = Date.now();

  return members.map((member) => {
    const presence = presenceByUserId.get(member.userId);
    const lastSeenAt = presence?.lastSeenAt || null;
    const isOnline = lastSeenAt
      ? now - lastSeenAt.getTime() <= ONLINE_WINDOW_MS
      : false;

    return {
      id: presence?.id || `${groupId}:${member.userId}`,
      groupId,
      userId: member.userId,
      lastSeenAt,
      status: isOnline ? "ONLINE" : "OFFLINE",
      user: member.user,
      isCurrentUser: member.userId === currentUserId
    };
  });
}

function addMessageMeta(message: any, currentUserId: string) {
  return {
    ...message,
    isMine: message.userId === currentUserId
  };
}

function groupInclude() {
  return {
    owner: {
      select: userSummarySelect
    },
    members: {
      include: {
        user: {
          select: userSummarySelect
        }
      },
      orderBy: {
        joinedAt: "asc" as const
      }
    },
    invites: {
      include: {
        invitedBy: {
          select: userSummarySelect
        },
        invitedUser: {
          select: userSummarySelect
        }
      },
      orderBy: {
        createdAt: "desc" as const
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
                createdAt: "desc" as const
              }
            },
            comments: {
              include: {
                user: {
                  select: userSummarySelect
                }
              },
              orderBy: {
                createdAt: "desc" as const
              }
            },
            assignedUser: {
              select: userSummarySelect
            }
          },
          orderBy: {
            startAt: "asc" as const
          }
        }
      },
      orderBy: {
        createdAt: "desc" as const
      }
    }
  };
}

function addProgressToGroup(group: any) {
  const decrypted = decryptCollaborationGroup(group);

  return {
    ...decrypted,
    schedules: (decrypted.schedules || []).map(withScheduleProgress)
  };
}

export async function collaborationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/groups", async (request) => {
    const userId = request.user.sub;

    const groups = await prisma.collaborationGroup.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: groupInclude(),
      orderBy: {
        updatedAt: "desc"
      }
    });

    return {
      groups: decryptCollaborationGroups(groups).map((group: any) => ({
        ...group,
        schedules: (group.schedules || []).map(withScheduleProgress)
      }))
    };
  });

  app.post("/groups", async (request, reply) => {
    const userId = request.user.sub;
    const data = groupBodySchema.parse(request.body);

    const group = await prisma.collaborationGroup.create({
      data: {
        ownerId: userId,
        ...encryptCollaborationGroupData({
          name: data.name,
          description: data.description
        }),
        members: {
          create: {
            userId,
            role: "OWNER"
          }
        }
      },
      include: groupInclude()
    });

    return reply.status(201).send({
      group: addProgressToGroup(group)
    });
  });

  app.get("/groups/:groupId", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    const group = await prisma.collaborationGroup.findUnique({
      where: {
        id: groupId
      },
      include: groupInclude()
    });

    if (!group) {
      return reply.status(404).send({
        message: "Grupo colaborativo nao encontrado."
      });
    }

    return {
      group: addProgressToGroup(group)
    };
  });

  app.get("/groups/:groupId/chat", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });
    const querySchema = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(50)
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const { limit } = querySchema.parse(request.query);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    await touchPresence(groupId, userId);

    const [messages, presence] = await Promise.all([
      prisma.collaborationMessage.findMany({
        where: {
          groupId
        },
        include: {
          user: {
            select: userSummarySelect
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: limit
      }),
      buildPresenceSnapshot(groupId, userId)
    ]);

    return {
      messages: decryptCollaborationMessages(messages)
        .reverse()
        .map((message) => addMessageMeta(message, userId)),
      presence,
      onlineCount: presence.filter((item) => item.status === "ONLINE").length
    };
  });

  app.post("/groups/:groupId/presence", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    await touchPresence(groupId, userId);

    const presence = await buildPresenceSnapshot(groupId, userId);

    return {
      presence,
      onlineCount: presence.filter((item) => item.status === "ONLINE").length
    };
  });

  app.post("/groups/:groupId/chat", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const data = chatMessageBodySchema.parse(request.body);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    await touchPresence(groupId, userId);

    const message = await prisma.collaborationMessage.create({
      data: encryptCollaborationMessageData({
        groupId,
        userId,
        message: data.message
      }),
      include: {
        user: {
          select: userSummarySelect
        }
      }
    });

    await prisma.collaborationGroup.update({
      where: {
        id: groupId
      },
      data: {
        updatedAt: new Date()
      }
    });

    const presence = await buildPresenceSnapshot(groupId, userId);

    // Disparar push para membros offline com notificações habilitadas (best-effort)
    void sendChatPushNotifications({
      groupId,
      senderUserId: userId,
      senderName: message.user.name,
      messageText: data.message
    });

    return reply.status(201).send({
      message: addMessageMeta(decryptCollaborationMessage(message), userId),
      presence,
      onlineCount: presence.filter((item) => item.status === "ONLINE").length
    });
  });

  app.patch("/groups/:groupId", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const bodySchema = groupBodySchema.partial().refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo para atualizar."
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const data = bodySchema.parse(request.body);

    const manager = await requireManager(groupId, userId, reply);
    if (!manager) return;

    const group = await prisma.collaborationGroup.update({
      where: {
        id: groupId
      },
      data: encryptCollaborationGroupData(data),
      include: groupInclude()
    });

    return {
      group: addProgressToGroup(group)
    };
  });

  app.delete("/groups/:groupId/membership", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    const otherMembers = await prisma.collaborationMember.findMany({
      where: {
        groupId,
        userId: {
          not: userId
        }
      },
      orderBy: {
        joinedAt: "asc"
      }
    });
    const nextOwner = otherMembers.find((member) => member.role === "ADMIN") || otherMembers[0] || null;

    await prisma.$transaction(async (transaction) => {
      await transaction.reminder.updateMany({
        where: {
          assignedUserId: userId,
          schedule: {
            groupId
          }
        },
        data: {
          assignedUserId: null
        }
      });

      if (membership.role === "OWNER" && !nextOwner) {
        await transaction.collaborationGroup.delete({
          where: {
            id: groupId
          }
        });
        return;
      }

      if (membership.role === "OWNER" && nextOwner) {
        await transaction.collaborationMember.update({
          where: {
            id: nextOwner.id
          },
          data: {
            role: "OWNER"
          }
        });
        await transaction.collaborationGroup.update({
          where: {
            id: groupId
          },
          data: {
            ownerId: nextOwner.userId
          }
        });
      }

      await transaction.collaborationMember.delete({
        where: {
          groupId_userId: {
            groupId,
            userId
          }
        }
      });
    });

    return reply.status(200).send({
      message: membership.role === "OWNER" && !nextOwner
        ? "Grupo removido porque voce era o ultimo membro."
        : "Voce saiu do grupo.",
      groupDeleted: membership.role === "OWNER" && !nextOwner
    });
  });

  app.post("/groups/:groupId/invites", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const data = inviteBodySchema.parse(request.body);

    const manager = await requireManager(groupId, userId, reply);
    if (!manager) return;

    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true
      }
    });

    if (currentUser?.email === data.email) {
      return reply.status(400).send({
        message: "Voce ja faz parte deste grupo."
      });
    }

    const invitedUser = await prisma.user.findUnique({
      where: {
        email: data.email
      },
      select: userSummarySelect
    });

    if (invitedUser) {
      const existingMember = await findMembership(groupId, invitedUser.id);

      if (existingMember) {
        return reply.status(409).send({
          message: "Este usuario ja faz parte do grupo."
        });
      }
    }

    const invite = await prisma.collaborationInvite.upsert({
      where: {
        groupId_email: {
          groupId,
          email: data.email
        }
      },
      create: {
        groupId,
        email: data.email,
        invitedById: userId,
        invitedUserId: invitedUser?.id,
        status: "PENDING",
        ...encryptCollaborationInviteData({
          message: data.message
        })
      },
      update: {
        invitedById: userId,
        invitedUserId: invitedUser?.id,
        status: "PENDING",
        acceptedAt: null,
        ...encryptCollaborationInviteData({
          message: data.message
        })
      },
      include: {
        group: {
          include: groupInclude()
        },
        invitedBy: {
          select: userSummarySelect
        },
        invitedUser: {
          select: userSummarySelect
        }
      }
    });

    return reply.status(201).send({
      invite: decryptCollaborationInvite(invite)
    });
  });

  app.get("/invites", async (request) => {
    const userId = request.user.sub;

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true
      }
    });

    const invites = await prisma.collaborationInvite.findMany({
      where: {
        status: "PENDING",
        OR: [
          {
            invitedUserId: userId
          },
          {
            email: user?.email || ""
          }
        ]
      },
      include: {
        group: {
          include: groupInclude()
        },
        invitedBy: {
          select: userSummarySelect
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      invites: decryptCollaborationInvites(invites)
    };
  });

  app.post("/invites/:inviteId/accept", async (request, reply) => {
    const paramsSchema = z.object({
      inviteId: z.string()
    });

    const userId = request.user.sub;
    const { inviteId } = paramsSchema.parse(request.params);

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true
      }
    });

    const invite = await prisma.collaborationInvite.findFirst({
      where: {
        id: inviteId,
        status: "PENDING",
        OR: [
          {
            invitedUserId: userId
          },
          {
            email: user?.email || ""
          }
        ]
      }
    });

    if (!invite) {
      return reply.status(404).send({
        message: "Convite nao encontrado."
      });
    }

    await prisma.$transaction([
      prisma.collaborationMember.upsert({
        where: {
          groupId_userId: {
            groupId: invite.groupId,
            userId
          }
        },
        create: {
          groupId: invite.groupId,
          userId,
          role: "MEMBER"
        },
        update: {}
      }),
      prisma.collaborationInvite.update({
        where: {
          id: invite.id
        },
        data: {
          invitedUserId: userId,
          status: "ACCEPTED",
          acceptedAt: new Date()
        }
      })
    ]);

    const group = await prisma.collaborationGroup.findUnique({
      where: {
        id: invite.groupId
      },
      include: groupInclude()
    });

    return {
      group: group ? addProgressToGroup(group) : null
    };
  });

  app.post("/invites/:inviteId/decline", async (request, reply) => {
    const paramsSchema = z.object({
      inviteId: z.string()
    });

    const userId = request.user.sub;
    const { inviteId } = paramsSchema.parse(request.params);

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true
      }
    });

    const invite = await prisma.collaborationInvite.findFirst({
      where: {
        id: inviteId,
        status: "PENDING",
        OR: [
          {
            invitedUserId: userId
          },
          {
            email: user?.email || ""
          }
        ]
      }
    });

    if (!invite) {
      return reply.status(404).send({
        message: "Convite nao encontrado."
      });
    }

    const declinedInvite = await prisma.collaborationInvite.update({
      where: {
        id: invite.id
      },
      data: {
        invitedUserId: userId,
        status: "DECLINED"
      },
      include: {
        group: {
          include: groupInclude()
        },
        invitedBy: {
          select: userSummarySelect
        }
      }
    });

    return {
      invite: decryptCollaborationInvite(declinedInvite)
    };
  });

  app.post("/groups/:groupId/schedules", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const data = scheduleBodySchema.parse(request.body);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    const schedule = await prisma.schedule.create({
      data: encryptScheduleData({
        userId,
        groupId,
        title: data.title,
        description: data.description,
        notes: data.notes,
        linksJson: normalizeLinks(data.links),
        extraInfo: data.extraInfo,
        category: data.category || "OTHER",
        sourceType: "MANUAL"
      }),
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
            },
            assignedUser: {
              select: userSummarySelect
            }
          },
          orderBy: {
            startAt: "asc"
          }
        }
      }
    });

    return reply.status(201).send({
      schedule: withScheduleProgress(decryptSchedule(schedule))
    });
  });

  app.post("/groups/:groupId/ai/suggest", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const data = aiSuggestRequestSchema.parse(request.body);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    const group = await prisma.collaborationGroup.findUnique({
      where: {
        id: groupId
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const decryptedGroup = decryptCollaborationGroup(group);
    const memberNames = (decryptedGroup?.members || [])
      .map((member: any) => member.user?.name)
      .filter(Boolean)
      .join(", ");

    const suggestion = await generateScheduleSuggestion({
      ...data,
      prompt: [
        `Grupo colaborativo: ${decryptedGroup?.name || "sem nome"}.`,
        memberNames ? `Participantes: ${memberNames}.` : "",
        "Crie uma rotina em tarefas claras para o grupo concluir em conjunto.",
        data.prompt
      ].filter(Boolean).join("\n")
    });

    return reply.status(200).send({
      suggestion: scheduleSuggestionSchema.parse(suggestion)
    });
  });

  app.post("/groups/:groupId/schedules/from-suggestion", async (request, reply) => {
    const paramsSchema = z.object({
      groupId: z.string()
    });

    const bodySchema = z.object({
      suggestion: scheduleSuggestionSchema
    });

    const userId = request.user.sub;
    const { groupId } = paramsSchema.parse(request.params);
    const { suggestion } = bodySchema.parse(request.body);

    const membership = await requireMembership(groupId, userId, reply);
    if (!membership) return;

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        groupId,
        ...encryptScheduleData({
          title: suggestion.title,
          description: suggestion.description || undefined,
          notes: suggestion.notes || undefined,
          linksJson: normalizeLinks(suggestion.links),
          extraInfo: suggestion.extraInfo || undefined
        }),
        category: suggestion.category,
        sourceType: "AI_PROMPT",
        reminders: {
          create: suggestion.reminders.map((reminder) =>
            encryptReminderData({
              title: reminder.title,
              description: reminder.description || undefined,
              notes: reminder.notes || undefined,
              linksJson: normalizeLinks(reminder.links),
              location: reminder.location || undefined,
              priority: reminder.priority || "NORMAL",
              startAt: buildStartAt(reminder.date, reminder.time),
              timezone: reminder.timezone
            })
          )
        }
      },
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
            },
            assignedUser: {
              select: userSummarySelect
            }
          },
          orderBy: {
            startAt: "asc"
          }
        }
      }
    });

    return reply.status(201).send({
      schedule: withScheduleProgress(decryptSchedule(schedule))
    });
  });

  app.post("/reminders/:reminderId/comments", async (request, reply) => {
    const paramsSchema = z.object({
      reminderId: z.string()
    });

    const userId = request.user.sub;
    const { reminderId } = paramsSchema.parse(request.params);
    const data = commentBodySchema.parse(request.body);

    const reminder = await prisma.reminder.findUnique({
      where: {
        id: reminderId
      },
      include: {
        schedule: {
          select: {
            groupId: true
          }
        }
      }
    });

    if (!reminder?.schedule.groupId) {
      return reply.status(404).send({
        message: "Tarefa colaborativa nao encontrada."
      });
    }

    const membership = await requireMembership(reminder.schedule.groupId, userId, reply);
    if (!membership) return;

    const comment = await prisma.reminderComment.create({
      data: encryptReminderCommentData({
        reminderId,
        userId,
        message: data.message
      }),
      include: {
        user: {
          select: userSummarySelect
        }
      }
    });

    return reply.status(201).send({
      comment: decryptReminderComment(comment)
    });
  });

  app.patch("/reminders/:reminderId/assignee", async (request, reply) => {
    const paramsSchema = z.object({
      reminderId: z.string()
    });

    const userId = request.user.sub;
    const { reminderId } = paramsSchema.parse(request.params);
    const { assignedUserId } = assignReminderSchema.parse(request.body);

    const reminder = await prisma.reminder.findUnique({
      where: {
        id: reminderId
      },
      include: {
        schedule: true
      }
    });

    if (!reminder?.schedule.groupId) {
      return reply.status(404).send({
        message: "Tarefa colaborativa nao encontrada."
      });
    }

    const membership = await requireMembership(reminder.schedule.groupId, userId, reply);
    if (!membership) return;

    if (assignedUserId) {
      const assignedMembership = await findMembership(reminder.schedule.groupId, assignedUserId);

      if (!assignedMembership) {
        return reply.status(400).send({
          message: "Responsavel precisa fazer parte do grupo."
        });
      }
    }

    const updatedReminder = await prisma.reminder.update({
      where: {
        id: reminderId
      },
      data: {
        assignedUserId
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
        },
        assignedUser: {
          select: userSummarySelect
        }
      }
    });

    return {
      reminder: decryptSchedule({ reminders: [updatedReminder] }).reminders?.[0]
    };
  });
}

async function sendChatPushNotifications(opts: {
  groupId: string;
  senderUserId: string;
  senderName: string;
  messageText: string;
}) {
  const { groupId, senderUserId, senderName, messageText } = opts;

  const group = await prisma.collaborationGroup.findUnique({
    where: { id: groupId },
    select: { name: true }
  });

  if (!group) return;

  const members = await prisma.collaborationMember.findMany({
    where: {
      groupId,
      userId: { not: senderUserId }
    },
    include: {
      user: {
        select: {
          id: true,
          pushToken: true,
          notificationPreference: {
            select: { chatNotificationsEnabled: true }
          }
        }
      }
    }
  });

  const preview = messageText.length > 80 ? `${messageText.slice(0, 77)}...` : messageText;
  const groupName = group.name.length > 40 ? `${group.name.slice(0, 37)}...` : group.name;

  const payloads: PushPayload[] = members
    .filter((m) => {
      if (!m.user.pushToken) return false;
      const pref = m.user.notificationPreference;
      return pref === null || pref.chatNotificationsEnabled !== false;
    })
    .map((m) => ({
      to: m.user.pushToken as string,
      title: `💬 ${groupName}`,
      body: `${senderName}: ${preview}`,
      data: {
        type: "CHAT_MESSAGE",
        groupId
      }
    }));

  await sendExpoPushNotificationBatch(payloads);
}
