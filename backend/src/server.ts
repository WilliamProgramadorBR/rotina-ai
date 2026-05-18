import "dotenv/config";
import path from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { ZodError } from "zod";

import { authRoutes } from "./routes/auth.routes";
import { schedulesRoutes } from "./routes/schedules.routes";
import { remindersRoutes } from "./routes/reminders.routes";
import { iaRoutes } from "./routes/ia.routes";
import { metricsRoutes } from "./routes/metrics.routes";
import { alarmLogsRoutes } from "./routes/alarm-logs.routes";
import { collaborationRoutes } from "./routes/collaboration.routes";
import { notificationsRoutes } from "./routes/notifications.routes";
import {
  isCorsOriginAllowed,
  isUsingJwtSecretForDataEncryption,
  jwtSecret,
  securityHeaders
} from "./config/security";
import { createRateLimitPreHandler } from "./security/rateLimit";

const app = Fastify({
  bodyLimit: 1024 * 1024,
  logger: {
    redact: [
      "req.headers.authorization",
      "request.headers.authorization",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.HUGGINGFACE_API_KEY",
      "*.GEMINI_API_KEY"
    ]
  },
  trustProxy: true
});

const PORT = Number(process.env.PORT || 3333);

if (isUsingJwtSecretForDataEncryption) {
  app.log.warn("DATA_ENCRYPTION_KEY nao foi configurado; criptografia de dados esta derivando do JWT_SECRET atual.");
}

app.addHook("onRequest", async (_request, reply) => {
  for (const [name, value] of Object.entries(securityHeaders)) {
    reply.header(name, value);
  }
});

app.addHook("onRequest", createRateLimitPreHandler({
  scope: "global",
  max: 600,
  windowMs: 60_000
}));

app.register(multipart);

app.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/",
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
});

app.register(cors, {
  credentials: true,
  origin: (origin, callback) => {
    callback(null, isCorsOriginAllowed(origin));
  }
});

app.register(jwt, {
  secret: jwtSecret
});

app.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({
      message: "Token inválido ou ausente."
    });
  }
});

app.get("/health", async () => {
  return {
    status: "ok",
    app: "Rotina AI Backend"
  };
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Dados invalidos.",
      issues: error.issues
    });
  }

  const handledError = error as Error & { statusCode?: number };
  const statusCode = handledError.statusCode && handledError.statusCode < 500
    ? handledError.statusCode
    : 500;

  if (statusCode >= 500) {
    request.log.error(error);
  }

  return reply.status(statusCode).send({
    message: statusCode >= 500
      ? "Erro interno do servidor."
      : handledError.message
  });
});

app.register(authRoutes, {
  prefix: "/auth"
});

app.register(iaRoutes, {
  prefix: "/ai"
});

app.register(schedulesRoutes, {
  prefix: "/schedules"
});

app.register(remindersRoutes, {
  prefix: "/reminders"
});

app.register(metricsRoutes, {
  prefix: "/metrics"
});

app.register(alarmLogsRoutes, {
  prefix: "/alarm-logs"
});

app.register(collaborationRoutes, {
  prefix: "/collaboration"
});

app.register(notificationsRoutes, {
  prefix: "/notifications"
});

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
