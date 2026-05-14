import type { FastifyReply, FastifyRequest } from "fastify";

type RateLimitOptions = {
  scope: string;
  max: number;
  windowMs: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

function getClientIp(request: FastifyRequest) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(",")[0].trim();
  }

  return request.ip || "unknown";
}

export function createRateLimitPreHandler(options: RateLimitOptions) {
  return async function rateLimitPreHandler(request: FastifyRequest, reply: FastifyReply) {
    const now = Date.now();
    const key = `${options.scope}:${getClientIp(request)}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs
      });
      return;
    }

    current.count += 1;

    if (current.count <= options.max) {
      return;
    }

    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);

    return reply
      .header("Retry-After", String(retryAfterSeconds))
      .status(429)
      .send({
        message: "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente."
      });
  };
}
