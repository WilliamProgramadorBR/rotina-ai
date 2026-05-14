import {
  ScheduleSuggestion,
  scheduleSuggestionSchema
} from "./scheduleSuggestion.schema";

type GenerateScheduleSuggestionInput = {
  prompt: string;
  startDate?: string;
  timezone?: string;
};

type NormalizedInput = {
  prompt: string;
  startDate: string;
  timezone: string;
};

function getTodayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function normalizeInput(input: GenerateScheduleSuggestionInput): NormalizedInput {
  return {
    prompt: input.prompt,
    startDate: input.startDate || getTodayInSaoPaulo(),
    timezone: input.timezone || "America/Sao_Paulo"
  };
}

function stripJsonFence(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function extractJsonObject(text: string) {
  const cleaned = stripJsonFence(text);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("A resposta da Hugging Face nao contem um objeto JSON completo.");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function parseJsonFromModel(text: string) {
  return JSON.parse(extractJsonObject(text));
}

function enrichMissingFields(parsed: any) {
  const category = String(parsed?.category || "OTHER").toUpperCase();

  if (!Array.isArray(parsed.links)) {
    parsed.links = [];
  }

  if (!parsed.notes || String(parsed.notes).trim().length < 5) {
    parsed.notes =
      category === "HEALTH"
        ? "Revise todos os horarios e informacoes com base na receita ou orientacao medica antes de salvar."
        : "Revise os horarios sugeridos e ajuste a rotina conforme sua disponibilidade antes de salvar.";
  }

  if (!parsed.extraInfo || String(parsed.extraInfo).trim().length < 5) {
    parsed.extraInfo = "Cronograma gerado automaticamente pela IA com base no pedido do usuario.";
  }

  if (!Array.isArray(parsed.warnings)) {
    parsed.warnings = [];
  }

  if (Array.isArray(parsed.reminders)) {
    parsed.reminders = parsed.reminders.map((reminder: any) => {
      if (!Array.isArray(reminder.links)) {
        reminder.links = [];
      }

      if (!reminder.notes || String(reminder.notes).trim().length < 5) {
        reminder.notes =
          category === "HEALTH"
            ? "Confirme medicamento, dose e horario com a receita antes de executar."
            : "Revise este lembrete e ajuste se necessario antes de confirmar.";
      }

      if (!reminder.priority) {
        reminder.priority = category === "HEALTH" ? "CRITICAL" : "NORMAL";
      }

      if (typeof reminder.location === "undefined") {
        reminder.location = null;
      }

      if (!reminder.timezone) {
        reminder.timezone = "America/Sao_Paulo";
      }

      return reminder;
    });
  }

  return parsed;
}

function buildSystemInstruction(input: NormalizedInput) {
  return `
Voce e um assistente de planejamento de rotina para um app de lembretes.
Sua funcao e transformar o pedido do usuario em uma sugestao estruturada de cronograma.

REGRAS IMPORTANTES:
- Responda APENAS JSON valido.
- Nao use markdown.
- Nao use bloco de codigo.
- Nao escreva explicacoes fora do JSON.
- Nao de diagnostico medico.
- Nao altere prescricao medica.
- Nao recomende medicamento.
- Nao invente dosagem.
- Se o usuario mencionar receita/remedio, apenas organize lembretes com base no que foi informado.
- Sempre inclua warning pedindo revisao humana quando o tema for saude/remedio.
- Gere no maximo 24 lembretes individuais.
- Use datas no formato YYYY-MM-DD.
- Use horarios no formato HH:mm.
- Timezone padrao: ${input.timezone}.
- Data inicial de referencia: ${input.startDate}.
- Categorias permitidas: HEALTH, STUDY, WORKOUT, WORK, SLEEP, WATER, PERSONAL, OTHER.
- sourceType deve ser AI_PROMPT.
- priority deve ser uma destas opcoes: LOW, NORMAL, HIGH, CRITICAL.
- confidence deve ser um numero entre 0 e 1.
- Quando nao houver valor para campos opcionais, use null.
- Quando nao houver links, use array vazio [].

Formato obrigatorio:
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
      "timezone": "${input.timezone}"
    }
  ]
}
`.trim();
}

function buildUserPrompt(input: NormalizedInput) {
  return `
Pedido do usuario:
${input.prompt}

Data inicial preferencial: ${input.startDate}
Timezone: ${input.timezone}
`.trim();
}

function buildRepairPrompt(rawText: string, input: NormalizedInput) {
  return `
Corrija o texto abaixo e devolva somente um JSON valido, completo e compativel com o formato exigido.

REGRAS:
- Responda exclusivamente em JSON valido.
- Nao use markdown.
- Nao explique.
- Feche todas as aspas, arrays e objetos.
- Nao gere mais de 24 lembretes.
- Use timezone "${input.timezone}".
- Use datas YYYY-MM-DD e horarios HH:mm.
- sourceType deve ser "AI_PROMPT".
- links deve ser array. Se nao houver links, use [].

TEXTO QUEBRADO:
${rawText}
`.trim();
}

function buildQwenTextPrompt(systemInstruction: string, userPrompt: string) {
  return `<|im_start|>system
${systemInstruction}
<|im_end|>
<|im_start|>user
${userPrompt}
<|im_end|>
<|im_start|>assistant
`;
}

function getHuggingFaceConfig() {
  const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY nao configurada.");
  }

  return {
    apiKey,
    model:
      process.env.HUGGINGFACE_MODEL ||
      process.env.HF_MODEL ||
      "Qwen/Qwen2.5-7B-Instruct",
    chatUrl:
      process.env.HUGGINGFACE_CHAT_URL ||
      "https://router.huggingface.co/v1/chat/completions",
    timeoutMs: Number(
      process.env.HUGGINGFACE_TIMEOUT_MS ||
        process.env.HF_TIMEOUT_MS ||
        60_000
    ),
    maxTokens: Number(
      process.env.HUGGINGFACE_MAX_TOKENS ||
        process.env.HF_MAX_TOKENS ||
        4096
    ),
    apiMode: String(process.env.HUGGINGFACE_API_MODE || "CHAT").toUpperCase()
  };
}

function compactErrorText(text: string) {
  return text.replace(/\s+/g, " ").slice(0, 1200);
}

function getChatContent(data: any) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        return part?.text || part?.content || "";
      })
      .join("")
      .trim();
  }

  return "";
}

async function callHuggingFaceChat(systemInstruction: string, userPrompt: string) {
  const config = getHuggingFaceConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = Date.now();

  try {
    console.log("[HUGGINGFACE] Iniciando geracao chat", {
      model: config.model,
      promptLength: userPrompt.length,
      timeoutMs: config.timeoutMs
    });

    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: config.maxTokens
    };

    if (process.env.HUGGINGFACE_RESPONSE_FORMAT === "json_object") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(config.chatUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao chamar Hugging Face chat: ${response.status} - ${compactErrorText(errorText)}`
      );
    }

    const data = await response.json();
    const text = getChatContent(data);

    if (!text) {
      throw new Error("Hugging Face nao retornou conteudo de chat.");
    }

    console.log("[HUGGINGFACE] Chat gerado com sucesso", {
      model: config.model,
      elapsedMs: Date.now() - startedAt,
      responseLength: text.length
    });

    return text;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Timeout ao chamar Hugging Face apos ${config.timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function callHuggingFaceTextGeneration(systemInstruction: string, userPrompt: string) {
  const config = getHuggingFaceConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const startedAt = Date.now();
  const modelUrl =
    process.env.HUGGINGFACE_INFERENCE_URL ||
    `https://api-inference.huggingface.co/models/${config.model}`;

  try {
    console.log("[HUGGINGFACE] Iniciando geracao text-generation", {
      model: config.model,
      promptLength: userPrompt.length,
      timeoutMs: config.timeoutMs
    });

    const response = await fetch(modelUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: buildQwenTextPrompt(systemInstruction, userPrompt),
        parameters: {
          max_new_tokens: config.maxTokens,
          temperature: 0.2,
          top_p: 0.9,
          return_full_text: false
        },
        options: {
          wait_for_model: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao chamar Hugging Face text-generation: ${response.status} - ${compactErrorText(errorText)}`
      );
    }

    const data: any = await response.json();
    const text = Array.isArray(data)
      ? data?.[0]?.generated_text
      : data?.generated_text;

    if (!text || typeof text !== "string") {
      throw new Error("Hugging Face nao retornou texto gerado.");
    }

    console.log("[HUGGINGFACE] Text-generation gerado com sucesso", {
      model: config.model,
      elapsedMs: Date.now() - startedAt,
      responseLength: text.length
    });

    return text.trim();
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Timeout ao chamar Hugging Face apos ${config.timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function callHuggingFace(systemInstruction: string, userPrompt: string) {
  const config = getHuggingFaceConfig();

  if (config.apiMode === "TEXT_GENERATION") {
    return callHuggingFaceTextGeneration(systemInstruction, userPrompt);
  }

  try {
    return await callHuggingFaceChat(systemInstruction, userPrompt);
  } catch (error: any) {
    const allowFallback =
      process.env.HUGGINGFACE_LEGACY_FALLBACK !== "false" &&
      !String(error?.message || "").includes("401") &&
      !String(error?.message || "").includes("403");

    if (!allowFallback) {
      throw error;
    }

    console.warn("[HUGGINGFACE] Chat falhou. Tentando text-generation.", {
      message: String(error?.message || "")
    });

    return callHuggingFaceTextGeneration(systemInstruction, userPrompt);
  }
}

export async function generateScheduleSuggestionWithHuggingFace(
  params: GenerateScheduleSuggestionInput
): Promise<ScheduleSuggestion> {
  const input = normalizeInput(params);
  const systemInstruction = buildSystemInstruction(input);
  const userPrompt = buildUserPrompt(input);
  const firstResponse = await callHuggingFace(systemInstruction, userPrompt);

  try {
    const parsed = enrichMissingFields(parseJsonFromModel(firstResponse));
    return scheduleSuggestionSchema.parse(parsed);
  } catch {
    console.log("[HUGGINGFACE] JSON invalido na primeira tentativa. Tentando reparar...");

    const repairResponse = await callHuggingFace(
      systemInstruction,
      buildRepairPrompt(firstResponse, input)
    );

    const parsed = enrichMissingFields(parseJsonFromModel(repairResponse));
    return scheduleSuggestionSchema.parse(parsed);
  }
}
