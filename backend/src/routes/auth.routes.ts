import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().min(2, "Nome obrigatório."),
      email: z.string().email("E-mail inválido.").toLowerCase(),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.")
    });

    const { name, email, password } = bodySchema.parse(request.body);

    const userAlreadyExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userAlreadyExists) {
      return reply.status(409).send({
        message: "Este e-mail já está cadastrado."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

  app.post("/login", async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(1)
    });

    const { email, password } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return reply.status(401).send({
        message: "E-mail ou senha inválidos."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return reply.status(401).send({
        message: "E-mail ou senha inválidos."
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
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return {
      user
    };
  });
}