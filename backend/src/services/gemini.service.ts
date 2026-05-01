import { ScheduleSuggestion, scheduleSuggestionSchema } from "./scheduleSuggestion.schema";

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
    .replace(/```$/i, "")
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

function fallbackSuggestion(prompt: string, startDate?: string, timezone = "America/Sao_Paulo"): ScheduleSuggestion {
  const date = startDate || getTodayInSaoPaulo();

  return {
    title: "Cronograma sugerido",
    description: `Sugestão criada em modo local a partir do prompt: ${prompt.slice(0, 140)}`,
    category: "OTHER",
    sourceType: "AI_PROMPT",
    confidence: 0.35,
    warnings: [
      "GEMINI_API_KEY não configurada. Esta é uma sugestão simples para testar o fluxo.",
      "Revise todos os horários antes de salvar."
    ],
    reminders: [
      {
        title: "Revisar cronograma",
        description: "Ajuste este lembrete conforme sua rotina antes de confirmar.",
        date,
        time: "09:00",
        timezone
      }
    ]
  };
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
    return fallbackSuggestion(params.prompt, today, timezone);
  }

  const systemInstruction = `
Você é um assistente de planejamento de rotina para um app de lembretes.
Sua função é transformar o pedido do usuário em uma sugestão estruturada de cronograma.

REGRAS IMPORTANTES:
- Responda APENAS JSON válido. Não use markdown.
- Não dê diagnóstico médico, não altere prescrição, não recomende medicamento e não invente dosagem.
- Se o usuário mencionar receita/remédio, apenas organize lembretes com base no que foi informado.
- Sempre inclua warning pedindo revisão humana quando o tema for saúde/remédio.
- Gere no máximo 60 lembretes individuais.
- Use datas no formato YYYY-MM-DD e horários no formato HH:mm.
- Timezone padrão: ${timezone}.
- Data inicial de referência: ${today}.
- Categorias permitidas: HEALTH, STUDY, WORKOUT, WORK, SLEEP, WATER, PERSONAL, OTHER.
- sourceType deve ser AI_PROMPT.

Formato obrigatório:
{
  "title": "string",
  "description": "string ou null",
  "category": "HEALTH|STUDY|WORKOUT|WORK|SLEEP|WATER|PERSONAL|OTHER",
  "sourceType": "AI_PROMPT",
  "confidence": 0.0,
  "warnings": ["string"],
  "reminders": [
    {
      "title": "string",
      "description": "string ou null",
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
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
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao chamar Gemini: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("A IA não retornou conteúdo.");
  }

  const parsed = parseJsonFromModel(text);
  return scheduleSuggestionSchema.parse(parsed);
}
