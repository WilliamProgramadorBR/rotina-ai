import { ScheduleSuggestion } from "./scheduleSuggestion.schema";
import { generateScheduleSuggestionWithGemini } from "./gemini.service";
import { generateScheduleSuggestionWithHuggingFace } from "./huggingface.service";
import { generateScheduleSuggestionWithOllama } from "./ollama.service";

type AiProvider = "GEMINI" | "HUGGINGFACE" | "OLLAMA";

const providerAliases: Record<string, AiProvider> = {
  GEMINI: "GEMINI",
  GOOGLE: "GEMINI",
  HUGGINGFACE: "HUGGINGFACE",
  HUGGING_FACE: "HUGGINGFACE",
  HF: "HUGGINGFACE",
  QWEN: "HUGGINGFACE",
  OLLAMA: "OLLAMA",
  LOCAL: "OLLAMA"
};

function getTodayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function parseProvider(value?: string | null) {
  if (!value) return null;

  return providerAliases[value.trim().toUpperCase()] || null;
}

function getProviderPlan() {
  const primary = parseProvider(process.env.AI_PROVIDER) || "GEMINI";
  const fallbackProviders = (process.env.AI_PROVIDER_FALLBACKS || "")
    .split(",")
    .map((provider) => parseProvider(provider))
    .filter((provider): provider is AiProvider => Boolean(provider));

  return Array.from(new Set([primary, ...fallbackProviders]));
}

async function runProvider(
  provider: AiProvider,
  params: {
    prompt: string;
    startDate: string;
    timezone: string;
  }
) {
  switch (provider) {
    case "HUGGINGFACE":
      return generateScheduleSuggestionWithHuggingFace(params);
    case "OLLAMA":
      return generateScheduleSuggestionWithOllama(params);
    case "GEMINI":
    default:
      return generateScheduleSuggestionWithGemini(params);
  }
}

export async function generateScheduleSuggestion(params: {
  prompt: string;
  startDate?: string;
  timezone?: string;
}): Promise<ScheduleSuggestion> {
  const normalizedParams = {
    prompt: params.prompt,
    startDate: params.startDate || getTodayInSaoPaulo(),
    timezone: params.timezone || "America/Sao_Paulo"
  };
  const providers = getProviderPlan();
  let lastError: unknown = null;

  for (const provider of providers) {
    try {
      console.log("[AI_PROVIDER] Gerando sugestao", {
        provider,
        model:
          provider === "HUGGINGFACE"
            ? process.env.HUGGINGFACE_MODEL || process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct"
            : provider === "GEMINI"
              ? process.env.GEMINI_MODEL || "gemini-2.5-flash"
              : process.env.OLLAMA_MODEL || "llama3.2:3b"
      });

      return await runProvider(provider, normalizedParams);
    } catch (error: any) {
      lastError = error;

      console.warn("[AI_PROVIDER] Provider falhou", {
        provider,
        message: String(error?.message || error)
      });
    }
  }

  throw new Error(
    `Todos os provedores de IA falharam: ${String(
      (lastError as any)?.message || lastError || "erro desconhecido"
    )}`
  );
}
