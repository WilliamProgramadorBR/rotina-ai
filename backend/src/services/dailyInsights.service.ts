import { prisma } from "../lib/prisma";

export type InsightTip = {
  type: "celebration" | "pattern" | "warning" | "suggestion";
  icon: string;
  title: string;
  text: string;
};

export type DailyInsights = {
  score: number;
  trend: "up" | "down" | "stable";
  headline: string;
  tips: InsightTip[];
  bestPeriod: string | null;
  weakCategory: string | null;
  strongCategory: string | null;
  generatedAt: string;
};

function getPeriodLabel(hour: number) {
  if (hour < 6) return "Madrugada";
  if (hour < 12) return "Manha";
  if (hour < 18) return "Tarde";
  return "Noite";
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    HEALTH: "Saúde", STUDY: "Estudo", WORKOUT: "Treino",
    WORK: "Trabalho", SLEEP: "Sono", WATER: "Hidratação",
    PERSONAL: "Pessoal", OTHER: "Outros"
  };
  return map[cat] || cat;
}

function stripJsonFence(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseJsonSafe(text: string) {
  const cleaned = stripJsonFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI não retornou JSON válido");
  }
}

function getDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function collectUserStats(userId: string, today: string) {
  const todayStart = new Date(`${today}T00:00:00`);
  const todayEnd = new Date(`${today}T23:59:59`);

  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday);

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const remindersLast7 = await prisma.reminder.findMany({
    where: {
      schedule: {
        OR: [
          { userId },
          { group: { members: { some: { userId } } } }
        ]
      },
      startAt: { gte: sevenDaysAgo, lte: todayEnd }
    },
    include: {
      schedule: { select: { category: true, groupId: true } },
      logs: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { startAt: "asc" }
  });

  const yesterdayReminders = remindersLast7.filter(
    (r) => getDateString(r.startAt) === yesterdayStr
  );

  const todayReminders = remindersLast7.filter(
    (r) => r.startAt >= todayStart && r.startAt <= todayEnd
  );

  function getAction(r: typeof remindersLast7[0]) {
    return r.logs[0]?.action || null;
  }

  function isDone(r: typeof remindersLast7[0]) {
    return getAction(r) === "DONE";
  }

  const yesterdayTotal = yesterdayReminders.length;
  const yesterdayDone = yesterdayReminders.filter(isDone).length;
  const yesterdayRate = yesterdayTotal > 0 ? yesterdayDone / yesterdayTotal : null;

  // Period breakdown for yesterday
  const periodStats: Record<string, { total: number; done: number }> = {};
  for (const r of yesterdayReminders) {
    const period = getPeriodLabel(r.startAt.getHours());
    if (!periodStats[period]) periodStats[period] = { total: 0, done: 0 };
    periodStats[period].total++;
    if (isDone(r)) periodStats[period].done++;
  }

  // Best period (highest completion rate with at least 1 task)
  let bestPeriod: string | null = null;
  let bestRate = -1;
  for (const [period, stats] of Object.entries(periodStats)) {
    if (stats.total > 0) {
      const rate = stats.done / stats.total;
      if (rate > bestRate) { bestRate = rate; bestPeriod = period; }
    }
  }

  // Category breakdown for last 7 days
  const categoryStats: Record<string, { total: number; done: number }> = {};
  for (const r of remindersLast7) {
    const cat = r.schedule.category;
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, done: 0 };
    categoryStats[cat].total++;
    if (isDone(r)) categoryStats[cat].done++;
  }

  let weakCategory: string | null = null;
  let weakRate = 2;
  let strongCategory: string | null = null;
  let strongRateVal = -1;
  for (const [cat, stats] of Object.entries(categoryStats)) {
    if (stats.total >= 2) {
      const rate = stats.done / stats.total;
      if (rate < weakRate) { weakRate = rate; weakCategory = cat; }
      if (rate > strongRateVal) { strongRateVal = rate; strongCategory = cat; }
    }
  }

  // Group vs individual
  const groupReminders = remindersLast7.filter((r) => r.schedule.groupId !== null);
  const individualReminders = remindersLast7.filter((r) => r.schedule.groupId === null);
  const groupDoneRate = groupReminders.length > 0
    ? groupReminders.filter(isDone).length / groupReminders.length
    : null;
  const individualDoneRate = individualReminders.length > 0
    ? individualReminders.filter(isDone).length / individualReminders.length
    : null;

  // 7-day avg
  const last7Total = remindersLast7.filter((r) => r.startAt < todayStart).length;
  const last7Done = remindersLast7.filter((r) => r.startAt < todayStart && isDone(r)).length;
  const last7Avg = last7Total > 0 ? last7Done / last7Total : null;

  const todayDoneSoFar = todayReminders.filter(isDone).length;
  const todayOverdue = todayReminders.filter((r) => {
    const action = getAction(r);
    return r.startAt < new Date() && !action && !["DONE", "SKIPPED", "MISSED"].includes(action as string);
  }).length;

  return {
    yesterday: {
      date: yesterdayStr,
      total: yesterdayTotal,
      done: yesterdayDone,
      rate: yesterdayRate,
      periodStats
    },
    today: {
      date: today,
      total: todayReminders.length,
      doneSoFar: todayDoneSoFar,
      overdue: todayOverdue
    },
    last7: {
      avg: last7Avg
    },
    categories: Object.fromEntries(
      Object.entries(categoryStats).map(([cat, s]) => [
        cat,
        { total: s.total, done: s.done, rate: s.total > 0 ? s.done / s.total : 0, label: categoryLabel(cat) }
      ])
    ),
    bestPeriod,
    weakCategory,
    strongCategory,
    group: { rate: groupDoneRate, count: groupReminders.length },
    individual: { rate: individualDoneRate, count: individualReminders.length }
  };
}

const insightsJsonSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    trend: { type: "string", enum: ["up", "down", "stable"] },
    headline: { type: "string" },
    tips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["celebration", "pattern", "warning", "suggestion"] },
          icon: { type: "string" },
          title: { type: "string" },
          text: { type: "string" }
        },
        required: ["type", "icon", "title", "text"]
      }
    },
    bestPeriod: { type: ["string", "null"] },
    weakCategory: { type: ["string", "null"] },
    strongCategory: { type: ["string", "null"] }
  },
  required: ["score", "trend", "headline", "tips", "bestPeriod", "weakCategory", "strongCategory"]
};

async function callOllamaForInsights(stats: Awaited<ReturnType<typeof collectUserStats>>): Promise<DailyInsights> {
  const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma4";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 90000);

  const yesterdayPct = stats.yesterday.rate !== null
    ? `${Math.round(stats.yesterday.rate * 100)}%`
    : "sem dados";

  const last7Pct = stats.last7.avg !== null
    ? `${Math.round(stats.last7.avg * 100)}%`
    : "sem dados";

  const categoryLines = Object.entries(stats.categories)
    .filter(([, s]) => s.total >= 2)
    .map(([, s]) => `- ${s.label}: ${s.done}/${s.total} (${Math.round(s.rate * 100)}%)`)
    .join("\n");

  const groupLines = [
    stats.group.count > 0 ? `- Tarefas em grupo: ${Math.round((stats.group.rate || 0) * 100)}% concluídas (${stats.group.count} tarefas)` : null,
    stats.individual.count > 0 ? `- Tarefas individuais: ${Math.round((stats.individual.rate || 0) * 100)}% concluídas (${stats.individual.count} tarefas)` : null
  ].filter(Boolean).join("\n");

  const periodLines = Object.entries(stats.yesterday.periodStats)
    .map(([period, s]) => `- ${period}: ${s.done}/${s.total}`)
    .join("\n");

  const prompt = `
Você é um assistente de produtividade. Analise os dados do usuário e retorne um JSON com insights.

Dados de desempenho:
Ontem (${stats.yesterday.date}): ${stats.yesterday.done}/${stats.yesterday.total} tarefas concluídas (${yesterdayPct})
Média 7 dias: ${last7Pct}
Hoje (${stats.today.date}): ${stats.today.doneSoFar}/${stats.today.total} concluídas, ${stats.today.overdue} em atraso

Distribuição por período (ontem):
${periodLines || "Sem dados"}

Categorias (7 dias):
${categoryLines || "Sem dados"}
${groupLines ? `\nPor tipo:\n${groupLines}` : ""}

Melhor período: ${stats.bestPeriod || "indeterminado"}
Categoria mais fraca: ${stats.weakCategory ? categoryLabel(stats.weakCategory) : "indeterminada"}
Categoria mais forte: ${stats.strongCategory ? categoryLabel(stats.strongCategory) : "indeterminada"}

Retorne APENAS JSON válido com:
- score: número 0-100 baseado na taxa de conclusão de ontem
- trend: "up" se melhorou vs média, "down" se piorou, "stable" se similar
- headline: frase motivadora em português, máx 60 chars
- tips: exatamente 3 objetos com type (celebration/pattern/warning/suggestion), icon (MaterialCommunityIcons), title (máx 40 chars), text (dica útil em português, máx 120 chars)
- bestPeriod: "Manhã"/"Tarde"/"Noite"/"Madrugada"/null
- weakCategory: categoria com pior desempenho ou null
- strongCategory: categoria com melhor desempenho ou null
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const startedAt = Date.now();

  try {
    console.log("[OLLAMA_INSIGHTS] Iniciando geração", { baseUrl, model, timeoutMs });

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: insightsJsonSchema,
        options: { temperature: 0.4, num_ctx: 4096, num_predict: 1024 },
        keep_alive: "2m"
      })
    });

    const elapsedMs = Date.now() - startedAt;
    console.log("[OLLAMA_INSIGHTS] Resposta recebida", { status: response.status, elapsedMs });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();

    if (!data?.response || typeof data.response !== "string") {
      throw new Error("Ollama não retornou resposta de texto válida para insights");
    }

    const parsed = parseJsonSafe(data.response);

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      trend: ["up", "down", "stable"].includes(parsed.trend) ? parsed.trend : "stable",
      headline: String(parsed.headline || "Continue firme na sua rotina!").slice(0, 80),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 4).map((t: any) => ({
        type: ["celebration", "pattern", "warning", "suggestion"].includes(t.type) ? t.type : "suggestion",
        icon: String(t.icon || "lightbulb-on-outline"),
        title: String(t.title || "Dica").slice(0, 60),
        text: String(t.text || "").slice(0, 150)
      })) : [],
      bestPeriod: parsed.bestPeriod || stats.bestPeriod || null,
      weakCategory: parsed.weakCategory || null,
      strongCategory: parsed.strongCategory || null,
      generatedAt: new Date().toISOString()
    };
  } catch (error: any) {
    if (error?.name === "AbortError") throw new Error(`Timeout ao chamar Ollama para insights após ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackInsights(): DailyInsights {
  return {
    score: 50,
    trend: "stable",
    headline: "Construindo sua análise personalizada",
    tips: [
      {
        type: "suggestion",
        icon: "clock-check-outline",
        title: "Horário consistente",
        text: "Manter tarefas no mesmo horário diariamente aumenta em até 60% a taxa de conclusão."
      },
      {
        type: "pattern",
        icon: "chart-bar",
        title: "Dados insuficientes ainda",
        text: "Complete mais tarefas para que a IA identifique seus melhores padrões de produtividade."
      },
      {
        type: "suggestion",
        icon: "lightbulb-on-outline",
        title: "Comece pequeno",
        text: "Tarefas curtas de até 25 minutos têm maior taxa de conclusão. Experimente o Modo Foco."
      }
    ],
    bestPeriod: null,
    weakCategory: null,
    strongCategory: null,
    generatedAt: new Date().toISOString()
  };
}

export async function generateDailyInsightsForUser(userId: string, today: string): Promise<DailyInsights> {
  try {
    const stats = await collectUserStats(userId, today);

    if (stats.yesterday.total === 0 && stats.last7.avg === null) {
      return buildFallbackInsights();
    }

    return await callOllamaForInsights(stats);
  } catch (error: any) {
    console.warn("[DAILY_INSIGHTS] Falha ao gerar insights, usando fallback", { error: error?.message });
    return buildFallbackInsights();
  }
}
