import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { authRoutes } from "./routes/auth.routes";
import { schedulesRoutes } from "./routes/schedules.routes";
import { remindersRoutes } from "./routes/reminders.routes";
import { aiRoutes } from "./routes/ia.routes";
const app = Fastify({
  logger: true
});

const PORT = Number(process.env.PORT || 3333);

app.register(cors, {
  origin: true
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret"
});
app.register(aiRoutes, {
  prefix: "/ai"
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

app.register(authRoutes, {
  prefix: "/auth"
});

app.register(schedulesRoutes, {
  prefix: "/schedules"
});

app.register(remindersRoutes, {
  prefix: "/reminders"
});

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});