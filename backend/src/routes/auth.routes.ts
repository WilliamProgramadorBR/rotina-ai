import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { createRateLimitPreHandler } from "../security/rateLimit";
import { sendPasswordResetEmail } from "../services/email.service";

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const authRateLimit = createRateLimitPreHandler({
  scope: "auth",
  max: 20,
  windowMs: 60_000
});

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true
};

const avatarUrlSchema = z.string().trim().max(2000, "URL da foto muito longa.").nullable().optional().refine((value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "Use uma URL valida para a foto.");

function hasField<T extends object>(data: T, field: keyof T) {
  return Object.prototype.hasOwnProperty.call(data, field);
}

function normalizeAvatarUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", {
    preHandler: [authRateLimit]
  }, async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().trim().min(2, "Nome obrigatorio."),
      email: z.string().trim().email("E-mail invalido.").toLowerCase(),
      password: z.string().min(8, "Senha deve ter no minimo 8 caracteres."),
      acceptedPrivacy: z.boolean().refine((value) => value === true, {
        message: "Voce precisa aceitar os termos de privacidade para criar a conta."
      })
    });

    const { name, email, password } = bodySchema.parse(request.body);

    const userAlreadyExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userAlreadyExists) {
      return reply.status(409).send({
        message: "Este e-mail ja esta cadastrado."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        acceptedPrivacyAt: new Date()
      },
      select: userSelect
    });

    const token = app.jwt.sign(
      {
        email: user.email
      },
      {
        sub: user.id,
        expiresIn: "7d"
      }
    );

    return reply.status(201).send({
      user,
      token
    });
  });

  app.post("/login", {
    preHandler: [authRateLimit]
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().trim().email().toLowerCase(),
      password: z.string().min(1)
    });

    const { email, password } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return reply.status(401).send({
        message: "E-mail ou senha invalidos."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return reply.status(401).send({
        message: "E-mail ou senha invalidos."
      });
    }

    const token = app.jwt.sign(
      {
        email: user.email
      },
      {
        sub: user.id,
        expiresIn: "7d"
      }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      token
    };
  });

  app.get("/me", {
    preHandler: [app.authenticate]
  }, async (request) => {
    const userId = request.user.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect
    });

    return { user };
  });

  app.patch("/me", {
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().trim().min(2, "Nome obrigatorio.").max(80, "Nome muito longo.").optional(),
      email: z.string().trim().email("E-mail invalido.").toLowerCase().optional(),
      avatarUrl: avatarUrlSchema
    }).refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo para atualizar."
    });

    const userId = request.user.sub;
    const data = bodySchema.parse(request.body);
    const updateData: Record<string, string | null> = {};

    if (hasField(data, "name") && data.name) {
      updateData.name = data.name;
    }

    if (hasField(data, "email") && data.email) {
      const emailOwner = await prisma.user.findUnique({
        where: {
          email: data.email
        },
        select: {
          id: true
        }
      });

      if (emailOwner && emailOwner.id !== userId) {
        return reply.status(409).send({
          message: "Este e-mail ja esta cadastrado."
        });
      }

      updateData.email = data.email;
    }

    if (hasField(data, "avatarUrl")) {
      updateData.avatarUrl = normalizeAvatarUrl(data.avatarUrl);
    }

    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data: updateData,
      select: userSelect
    });

    return { user };
  });

  // POST /auth/forgot-password - envia codigo por e-mail
  app.post("/forgot-password", {
    preHandler: [authRateLimit]
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().trim().email().toLowerCase()
    });

    const { email } = bodySchema.parse(request.body);

    // Resposta sempre genérica — evita enumerar e-mails cadastrados
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Invalida tokens anteriores não utilizados
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });

      const code = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      await prisma.passwordResetToken.create({
        data: { userId: user.id, code, expiresAt }
      });

      try {
        await sendPasswordResetEmail(user.email, user.name, code);
      } catch (emailError) {
        request.log.error(emailError, "Falha ao enviar e-mail de recuperação");
        return reply.status(503).send({
          message: "Não foi possível enviar o e-mail. Verifique as configurações do servidor."
        });
      }
    }

    return reply.status(200).send({
      message: "Se esse e-mail estiver cadastrado, você receberá um código em instantes."
    });
  });

  // POST /auth/verify-reset-code — valida o código sem redefinir a senha
  app.post("/verify-reset-code", {
    preHandler: [authRateLimit]
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().trim().email().toLowerCase(),
      code: z.string().length(6)
    });

    const { email, code } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(400).send({ message: "Código inválido ou expirado." });
    }

    const token = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!token) {
      return reply.status(400).send({ message: "Código inválido ou expirado." });
    }

    return reply.status(200).send({ valid: true });
  });

  // POST /auth/reset-password — redefine a senha com código válido
  app.post("/reset-password", {
    preHandler: [authRateLimit]
  }, async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().trim().email().toLowerCase(),
      code: z.string().length(6),
      newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres.")
    });

    const { email, code, newPassword } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(400).send({ message: "Código inválido ou expirado." });
    }

    const token = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!token) {
      return reply.status(400).send({ message: "Código inválido ou expirado." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } })
    ]);

    return reply.status(200).send({ message: "Senha redefinida com sucesso." });
  });

  // POST /auth/push-token — salva token Expo para push notifications
  app.post("/push-token", {
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const bodySchema = z.object({
      pushToken: z.string().trim().min(1).max(255)
    });

    const userId = request.user.sub;
    const { pushToken } = bodySchema.parse(request.body);

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken }
    });

    return reply.status(204).send();
  });

  // POST /auth/avatar — upload nativo de foto de perfil
  app.post("/avatar", {
    preHandler: [app.authenticate],
    bodyLimit: 6 * 1024 * 1024
  }, async (request, reply) => {
    const data = await (request as any).file({ limits: { fileSize: 5 * 1024 * 1024 } });

    if (!data) {
      return reply.status(400).send({ message: "Nenhum arquivo enviado." });
    }

    const ext = path.extname(data.filename).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowed.includes(ext)) {
      data.file.resume();
      return reply.status(400).send({ message: "Formato nao suportado. Use JPG, PNG ou WebP." });
    }

    const userId = request.user.sub;
    const filename = `${userId}${ext}`;
    const uploadDir = path.join(process.cwd(), "uploads", "avatars");

    await fs.promises.mkdir(uploadDir, { recursive: true });
    await pipeline(data.file, fs.createWriteStream(path.join(uploadDir, filename)));

    const proto = (request.headers["x-forwarded-proto"] as string) || "http";
    const host = request.headers.host ?? "localhost:3333";
    const avatarUrl = `${proto}://${host}/uploads/avatars/${filename}`;

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });

    return reply.send({ avatarUrl });
  });
}
