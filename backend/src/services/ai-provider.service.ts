import type { ScheduleSuggestion } from "./scheduleSuggestion.schema";
import { generateScheduleSuggestionWithOllama } from "./ollama.service";
import { generateScheduleSuggestionWithGemini } from "./gemini.service";

type GenerateScheduleSuggestionInput = {
  prompt: string;
  startDate: string;
  timezone: string;
};

export async function generateScheduleSuggestion(
  input: GenerateScheduleSuggestionInput
): Promise<ScheduleSuggestion> {
  const provider = (process.env.AI_PROVIDER || "OLLAMA").toUpperCase();

  if (provider === "GEMINI") {
    return generateScheduleSuggestionWithGemini(input);
  }

  return generateScheduleSuggestionWithOllama(input);
}