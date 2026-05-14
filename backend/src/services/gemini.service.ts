import {
  ScheduleSuggestion,
  scheduleSuggestionSchema
} from "./scheduleSuggestion.schema";

function getTodayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function stripJsonFence(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseJsonFromModel(text: string) {
  const cleaned = stripJsonFence(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("A IA não retornou um JSON válido.");
  }
}

export async function generateScheduleSuggestionWithGemini(params: {
  prompt: string;
  startDate?: string;
  timezone?: string;
}): Promise<ScheduleSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const timezone = params.timezone || "America/Sao_Paulo";
  const today = params.startDate || getTodayInSaoPaulo();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const systemInstruction = `
Você é um assistente de planejamento de rotina para um app de lembretes.
Sua função é transformar o pedido do usuário em uma sugestão estruturada de cronograma.

REGRAS IMPORTANTES:
- Responda APENAS JSON válido.
- Não use markdown.
- Não use bloco de código.
- Não escreva explicações fora do JSON.
- Não dê diagnóstico médico.
- Não altere prescrição médica.
- Não recomende medicamento.
- Não invente dosagem.
- Se o usuário mencionar receita/remédio, apenas organize lembretes com base no que foi informado.
- Sempre inclua warning pedindo revisão humana quando o tema for saúde/remédio.
- Gere no máximo 60 lembretes individuais.
- Use datas no formato YYYY-MM-DD.
- Use horários no formato HH:mm.
- Timezone padrão: ${timezone}.
- Data inicial de referência: ${today}.
- Categorias permitidas: HEALTH, STUDY, WORKOUT, WORK, SLEEP, WATER, PERSONAL, OTHER.
- sourceType deve ser AI_PROMPT.
- priority deve ser uma destas opções: LOW, NORMAL, HIGH, CRITICAL.
- confidence deve ser um número entre 0 e 1.
- Quando não houver valor para campos opcionais, use null.
- Quando não houver links, use array vazio [].

Formato obrigatório:
{
  "title": "string",
  "description": "string ou null",
  "notes": "string ou null",
  "links": ["string"],
  "extraInfo": "string ou null",
  "category": "HEALTH",
  "sourceType": "AI_PROMPT",
  "confidence": 0.8,
  "warnings": ["string"],
  "reminders": [
    {
      "title": "string",
      "description": "string ou null",
      "notes": "string ou null",
      "links": ["string"],
      "location": "string ou null",
      "priority": "NORMAL",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "timezone": "America/Sao_Paulo"
    }
  ]
}
`.trim();

  const userPrompt = `
Pedido do usuário:
${params.prompt}

Data inicial preferencial: ${today}
Timezone: ${timezone}
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log("[GEMINI] Iniciando geração", {
      model,
      promptLength: params.prompt.length,
      timezone,
      today
    });

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Erro ao chamar Gemini: ${response.status} - ${errorText}`
      );
    }

    const data: any = await response.json();

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason && finishReason !== "STOP") {
      console.warn("[GEMINI] Finalização não padrão", {
        finishReason,
        promptFeedback: data?.promptFeedback
      });
    }

    const text = candidate?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new Error(
        `A IA não retornou conteúdo. finishReason=${finishReason || "UNKNOWN"}`
      );
    }

    const parsed = parseJsonFromModel(text);
    const suggestion = scheduleSuggestionSchema.parse(parsed);

    console.log("[GEMINI] Sugestão gerada com sucesso", {
      title: suggestion.title,
      category: suggestion.category,
      reminders: suggestion.reminders.length,
      confidence: suggestion.confidence
    });

    return suggestion;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Timeout ao chamar Gemini.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}