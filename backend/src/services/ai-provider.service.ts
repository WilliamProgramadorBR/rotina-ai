import { ScheduleSuggestion } from "./scheduleSuggestion.schema";
import { generateScheduleSuggestionWithGemini } from "./gemini.service";

export async function generateScheduleSuggestion(params: {
  prompt: string;
  startDate?: string;
  timezone?: string;
}): Promise<ScheduleSuggestion> {
  const provider = (process.env.AI_PROVIDER || "GEMINI").toUpperCase();

  if (provider !== "GEMINI") {
    console.warn("[AI_PROVIDER] Provider diferente de GEMINI detectado. Usando Gemini mesmo assim.", {
      provider
    });
  }

  return generateScheduleSuggestionWithGemini(params);
}