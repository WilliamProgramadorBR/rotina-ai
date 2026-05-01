import type { ScheduleSuggestion } from "./scheduleSuggestion.schema";
import { scheduleSuggestionSchema } from "./scheduleSuggestion.schema";

type GenerateScheduleSuggestionInput = {
  prompt: string;
  startDate: string;
  timezone: string;
};

const scheduleSuggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string"
    },
    description: {
      type: ["string", "null"]
    },
    category: {
      type: "string",
      enum: [
        "HEALTH",
        "STUDY",
        "WORKOUT",
        "WORK",
        "SLEEP",
        "WATER",
        "PERSONAL",
        "OTHER"
      ]
    },
    sourceType: {
      type: "string",
      enum: ["AI_PROMPT"]
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1
    },
    warnings: {
      type: "array",
      items: {
        type: "string"
      }
    },
    reminders: {
      type: "array",
      minItems: 1,
      maxItems: 24,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string"
          },
          description: {
            type: ["string", "null"]
          },
          date: {
            type: "string",
            description: "Data no formato YYYY-MM-DD"
          },
          time: {
            type: "string",
            description: "Hora no formato HH:mm"
          },
          timezone: {
            type: "string"
          }
        },
        required: ["title", "description", "date", "time", "timezone"]
      }
    }
  },
  required: [
    "title",
    "description",
    "category",
    "sourceType",
    "confidence",
    "warnings",
    "reminders"
  ]
};

function buildPrompt(input: GenerateScheduleSuggestionInput) {
  return `
Você é um assistente de organização de rotina.

Transforme o pedido do usuário em um cronograma de lembretes.

REGRAS DE SAÍDA:
- Responda exclusivamente em JSON válido.
- Não use markdown.
- Não use comentários.
- Não explique nada fora do JSON.
- Não quebre strings no meio.
- Não gere mais de 24 lembretes nesta resposta.
- Se a rotina tiver mais de 24 ocorrências, gere apenas as primeiras 24 e inclua um warning dizendo que a rotina foi limitada.
- Use datas no formato YYYY-MM-DD.
- Use horários no formato HH:mm.
- Use timezone "${input.timezone}".
- A data inicial de referência é "${input.startDate}".
- sourceType deve ser sempre "AI_PROMPT".
- confidence deve ser número entre 0 e 1.

REGRAS DE SEGURANÇA:
- Se envolver remédio, saúde, receita médica, dose, dosagem ou tratamento, use category "HEALTH".
- Se envolver saúde/remédio, inclua warnings orientando o usuário a revisar as informações antes de salvar.
- Você não deve diagnosticar, alterar dose, recomendar medicamento ou substituir médico.
- O objetivo é apenas organizar lembretes com base no pedido do usuário.

CATEGORIAS PERMITIDAS:
HEALTH, STUDY, WORKOUT, WORK, SLEEP, WATER, PERSONAL, OTHER

FORMATO OBRIGATÓRIO:
{
  "title": "string",
  "description": "string ou null",
  "category": "HEALTH",
  "sourceType": "AI_PROMPT",
  "confidence": 0.8,
  "warnings": ["string"],
  "reminders": [
    {
      "title": "string",
      "description": "string ou null",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "timezone": "${input.timezone}"
    }
  ]
}

PEDIDO DO USUÁRIO:
${input.prompt}
`.trim();
}

function buildRepairPrompt(rawText: string, input: GenerateScheduleSuggestionInput) {
  return `
Corrija o texto abaixo e devolva somente um JSON válido, completo e compatível com o formato exigido.

REGRAS:
- Responda exclusivamente em JSON válido.
- Não use markdown.
- Não explique.
- Feche todas as aspas, arrays e objetos.
- Não gere mais de 24 lembretes.
- Use timezone "${input.timezone}".
- Use datas YYYY-MM-DD e horários HH:mm.
- sourceType deve ser "AI_PROMPT".

FORMATO:
{
  "title": "string",
  "description": "string ou null",
  "category": "HEALTH | STUDY | WORKOUT | WORK | SLEEP | WATER | PERSONAL | OTHER",
  "sourceType": "AI_PROMPT",
  "confidence": 0.8,
  "warnings": ["string"],
  "reminders": [
    {
      "title": "string",
      "description": "string ou null",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "timezone": "${input.timezone}"
    }
  ]
}

TEXTO QUEBRADO:
${rawText}
`.trim();
}

function extractJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("A resposta da IA não contém um objeto JSON completo.");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function safeJsonParse(text: string) {
  const jsonText = extractJsonObject(text);
  return JSON.parse(jsonText);
}

async function callOllama(prompt: string) {
  const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: scheduleSuggestionJsonSchema,
      options: {
        temperature: 0,
        top_p: 0.9,
        num_ctx: 2048,
        num_predict: 1800
      },
      keep_alive: "2m"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Erro ao chamar Ollama: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data?.response || typeof data.response !== "string") {
    throw new Error("Ollama não retornou uma resposta de texto válida.");
  }

  return data.response;
}

export async function generateScheduleSuggestionWithOllama(
  input: GenerateScheduleSuggestionInput
): Promise<ScheduleSuggestion> {
  const firstResponse = await callOllama(buildPrompt(input));

  try {
    const parsed = safeJsonParse(firstResponse);
    return scheduleSuggestionSchema.parse(parsed);
  } catch (firstError) {
    console.log("[OLLAMA] JSON inválido na primeira tentativa. Tentando reparar...");

    const repairResponse = await callOllama(buildRepairPrompt(firstResponse, input));

    const repairedParsed = safeJsonParse(repairResponse);
    return scheduleSuggestionSchema.parse(repairedParsed);
  }
}