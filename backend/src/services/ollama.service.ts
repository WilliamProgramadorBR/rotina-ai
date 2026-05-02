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
    notes: {
      type: "string",
      description:
        "Observações gerais importantes sobre o cronograma. Deve ser útil, prática e revisável pelo usuário."
    },
    links: {
      type: "array",
      items: {
        type: "string"
      }
    },
    extraInfo: {
      type: "string",
      description:
        "Informações extras relevantes para orientar a rotina, cuidados, contexto ou recomendações de uso."
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
          notes: {
            type: "string",
            description:
              "Observação específica deste lembrete. Deve explicar cuidado, contexto ou instrução prática."
          },
          links: {
            type: "array",
            items: {
              type: "string"
            }
          },
          location: {
            type: ["string", "null"]
          },
          priority: {
            type: "string",
            enum: ["LOW", "NORMAL", "HIGH", "CRITICAL"]
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
        required: [
          "title",
          "description",
          "notes",
          "links",
          "location",
          "priority",
          "date",
          "time",
          "timezone"
        ]
      }
    }
  },
  required: [
    "title",
    "description",
    "notes",
    "links",
    "extraInfo",
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
- links deve ser array. Se não houver links, use [].
- location pode ser null quando o local não for informado.

REGRAS PARA OBSERVAÇÕES:
- O campo "notes" do cronograma NUNCA deve vir vazio.
- Crie uma observação útil e prática para o usuário revisar antes de salvar.
- Cada lembrete também deve ter "notes" com uma instrução curta e objetiva.
- Para saúde/remédio, as observações devem reforçar revisão da receita/orientação médica.
- Para estudo, as observações devem sugerir foco, revisão ou preparação.
- Para treino, as observações devem sugerir cuidado, hidratação, aquecimento ou segurança.
- Para trabalho, as observações devem sugerir foco, pausa ou organização.

REGRAS DE SEGURANÇA:
- Se envolver remédio, saúde, receita médica, dose, dosagem ou tratamento, use category "HEALTH".
- Se envolver saúde/remédio, inclua warnings orientando o usuário a revisar as informações antes de salvar.
- Você não deve diagnosticar, alterar dose, recomendar medicamento ou substituir médico.
- O objetivo é apenas organizar lembretes com base no pedido do usuário.

PRIORIDADES:
- Use "CRITICAL" para remédios, tratamentos, consultas ou compromissos críticos.
- Use "HIGH" para tarefas importantes com horário rígido.
- Use "NORMAL" para rotinas comuns.
- Use "LOW" para hábitos leves ou opcionais.

CATEGORIAS PERMITIDAS:
HEALTH, STUDY, WORKOUT, WORK, SLEEP, WATER, PERSONAL, OTHER

FORMATO OBRIGATÓRIO:
{
  "title": "string",
  "description": "string ou null",
  "notes": "observação geral útil para revisar o cronograma",
  "links": [],
  "extraInfo": "informações extras relevantes sobre a rotina",
  "category": "HEALTH | STUDY | WORKOUT | WORK | SLEEP | WATER | PERSONAL | OTHER",
  "sourceType": "AI_PROMPT",
  "confidence": 0.8,
  "warnings": ["string"],
  "reminders": [
    {
      "title": "string",
      "description": "string ou null",
      "notes": "observação prática específica deste lembrete",
      "links": [],
      "location": "string ou null",
      "priority": "LOW | NORMAL | HIGH | CRITICAL",
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
- O campo "notes" do cronograma deve conter uma observação útil.
- Cada lembrete deve conter "notes" com uma instrução prática.
- links deve ser array. Se não houver links, use [].

FORMATO:
{
  "title": "string",
  "description": "string ou null",
  "notes": "observação geral útil para revisar o cronograma",
  "links": [],
  "extraInfo": "informações extras relevantes sobre a rotina",
  "category": "HEALTH | STUDY | WORKOUT | WORK | SLEEP | WATER | PERSONAL | OTHER",
  "sourceType": "AI_PROMPT",
  "confidence": 0.8,
  "warnings": ["string"],
  "reminders": [
    {
      "title": "string",
      "description": "string ou null",
      "notes": "observação prática específica deste lembrete",
      "links": [],
      "location": "string ou null",
      "priority": "LOW | NORMAL | HIGH | CRITICAL",
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

function enrichMissingNotes(parsed: any) {
  const category = String(parsed?.category || "OTHER").toUpperCase();

  if (!parsed.notes || String(parsed.notes).trim().length < 5) {
    if (category === "HEALTH") {
      parsed.notes =
        "Revise todos os horários e informações com base na receita ou orientação médica antes de salvar.";
    } else if (category === "STUDY") {
      parsed.notes =
        "Mantenha o ambiente organizado e reserve alguns minutos para revisar o conteúdo após cada sessão.";
    } else if (category === "WORKOUT") {
      parsed.notes =
        "Faça aquecimento, respeite seus limites e mantenha hidratação durante a rotina.";
    } else {
      parsed.notes =
        "Revise os horários sugeridos e ajuste a rotina conforme sua disponibilidade antes de salvar.";
    }
  }

  if (!Array.isArray(parsed.links)) {
    parsed.links = [];
  }

  if (!parsed.extraInfo || String(parsed.extraInfo).trim().length < 5) {
    parsed.extraInfo =
      "Cronograma gerado automaticamente pela IA com base no pedido do usuário.";
  }

  if (Array.isArray(parsed.reminders)) {
    parsed.reminders = parsed.reminders.map((reminder: any) => {
      const reminderCategory = category;

      if (!reminder.notes || String(reminder.notes).trim().length < 5) {
        if (reminderCategory === "HEALTH") {
          reminder.notes =
            "Confirme medicamento, dose e horário com a receita antes de executar.";
        } else if (reminderCategory === "STUDY") {
          reminder.notes =
            "Prepare o material antes de começar e registre o que foi estudado.";
        } else if (reminderCategory === "WORKOUT") {
          reminder.notes =
            "Faça aquecimento e respeite seu ritmo durante a atividade.";
        } else {
          reminder.notes =
            "Revise este lembrete e ajuste se necessário antes de confirmar.";
        }
      }

      if (!Array.isArray(reminder.links)) {
        reminder.links = [];
      }

      if (!reminder.priority) {
        reminder.priority = reminderCategory === "HEALTH" ? "CRITICAL" : "NORMAL";
      }

      if (typeof reminder.location === "undefined") {
        reminder.location = null;
      }

      return reminder;
    });
  }

  return parsed;
}

async function callOllama(prompt: string) {
  const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  const controller = new AbortController();
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 90000);

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const startedAt = Date.now();

  try {
    console.log("[OLLAMA] Iniciando geração", {
      baseUrl,
      model,
      promptLength: prompt.length,
      timeoutMs
    });

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      signal: controller.signal,
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
          num_predict: 1200
        },
        keep_alive: "2m"
      })
    });

    const elapsedMs = Date.now() - startedAt;

    console.log("[OLLAMA] Resposta recebida", {
      status: response.status,
      elapsedMs
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`Erro ao chamar Ollama: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data?.response || typeof data.response !== "string") {
      throw new Error("Ollama não retornou uma resposta de texto válida.");
    }

    console.log("[OLLAMA] Texto gerado", {
      responseLength: data.response.length,
      elapsedMs
    });

    return data.response;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(
        `Timeout ao chamar Ollama após ${timeoutMs}ms. O modelo demorou demais para responder.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateScheduleSuggestionWithOllama(
  input: GenerateScheduleSuggestionInput
): Promise<ScheduleSuggestion> {
  const firstResponse = await callOllama(buildPrompt(input));

  try {
    const parsed = enrichMissingNotes(safeJsonParse(firstResponse));
    return scheduleSuggestionSchema.parse(parsed);
  } catch (firstError) {
    console.log("[OLLAMA] JSON inválido na primeira tentativa. Tentando reparar...");

    const repairResponse = await callOllama(buildRepairPrompt(firstResponse, input));

    const repairedParsed = enrichMissingNotes(safeJsonParse(repairResponse));
    return scheduleSuggestionSchema.parse(repairedParsed);
  }
}