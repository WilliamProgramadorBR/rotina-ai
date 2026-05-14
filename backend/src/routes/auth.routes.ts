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

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", {
    preHandler: [authRateLimit]
  }, async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().trim().min(2, "Nome obrigatorio."),
      email: z.string().trim().email("E-mail invalido.").toLowerCase(),
      password: z.string().min(8, "Senha deve ter no minimo 8 caracteres.")
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
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
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
        email: user.email
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
      select: { id: true, name: true, email: true, createdAt: true }
    });

    return { user };
  });

  // POST /auth/forgot-password — envia código por e-mail
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
}
