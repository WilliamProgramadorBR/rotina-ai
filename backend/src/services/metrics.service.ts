type ReminderAction = "DONE" | "SNOOZED" | "SKIPPED" | "MISSED";

type ReminderLogForMetrics = {
  userId?: string | null;
  action: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
};

type ReminderCommentForMetrics = {
  id: string;
  createdAt: Date;
};

type ReminderForMetrics = {
  id: string;
  scheduleId: string;
  startAt: Date;
  status?: string | null;
  priority?: string | null;
  logs?: ReminderLogForMetrics[];
  comments?: ReminderCommentForMetrics[];
};

type ScheduleForMetrics = {
  id: string;
  category?: string | null;
  sourceType?: string | null;
  reminders?: ReminderForMetrics[];
};

type CollaborationGroupForMetrics = {
  id: string;
  name: string;
  description?: string | null;
  members?: Array<{
    userId: string;
    role: string;
    user?: {
      id: string;
      name: string;
      email?: string | null;
    } | null;
  }>;
  schedules?: ScheduleForMetrics[];
};

const categoryLabels: Record<string, string> = {
  HEALTH: "Saude",
  STUDY: "Estudo",
  WORKOUT: "Treino",
  WORK: "Trabalho",
  SLEEP: "Sono",
  WATER: "Agua",
  PERSONAL: "Pessoal",
  OTHER: "Outro"
};

const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  CRITICAL: "Critica"
};

function roundPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

function getRate(done: number, total: number) {
  if (total <= 0) return 0;
  return roundPercent((done / total) * 100);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit"
  });
}

export function getLatestReminderAction(reminder: ReminderForMetrics): ReminderAction | null {
  const [latestLog] = [...(reminder.logs || [])].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (!latestLog) return null;

  if (
    latestLog.action === "DONE" ||
    latestLog.action === "SNOOZED" ||
    latestLog.action === "SKIPPED" ||
    latestLog.action === "MISSED"
  ) {
    return latestLog.action;
  }

  return null;
}

function getLatestDoneLog(reminder: ReminderForMetrics) {
  if (getLatestReminderAction(reminder) !== "DONE") {
    return null;
  }

  return [...(reminder.logs || [])]
    .filter((log) => log.action === "DONE")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null;
}

function isFinishedAction(action: ReminderAction | null) {
  return action === "DONE" || action === "SKIPPED" || action === "MISSED";
}

export function buildScheduleProgress(schedule: ScheduleForMetrics) {
  const reminders = schedule.reminders || [];
  const total = reminders.length;
  const done = reminders.filter((reminder) => getLatestReminderAction(reminder) === "DONE").length;
  const skipped = reminders.filter((reminder) => getLatestReminderAction(reminder) === "SKIPPED").length;
  const missed = reminders.filter((reminder) => getLatestReminderAction(reminder) === "MISSED").length;
  const snoozed = reminders.filter((reminder) => getLatestReminderAction(reminder) === "SNOOZED").length;
  const pending = Math.max(total - done - skipped - missed, 0);

  return {
    total,
    done,
    skipped,
    missed,
    snoozed,
    pending,
    completionRate: getRate(done, total)
  };
}

export function withScheduleProgress<T extends ScheduleForMetrics>(schedule: T) {
  return {
    ...schedule,
    progress: buildScheduleProgress(schedule)
  };
}

export function buildDashboardMetrics(schedules: ScheduleForMetrics[]) {
  const now = new Date();
  const reminders = schedules.flatMap((schedule) =>
    (schedule.reminders || []).map((reminder) => ({
      ...reminder,
      category: schedule.category || "OTHER",
      sourceType: schedule.sourceType || "MANUAL"
    }))
  );

  const dueReminders = reminders.filter((reminder) => reminder.startAt <= now);
  const doneReminders = reminders.filter((reminder) => getLatestReminderAction(reminder) === "DONE");
  const skippedReminders = reminders.filter((reminder) => getLatestReminderAction(reminder) === "SKIPPED");
  const missedReminders = reminders.filter((reminder) => getLatestReminderAction(reminder) === "MISSED");
  const snoozedReminders = reminders.filter((reminder) => getLatestReminderAction(reminder) === "SNOOZED");
  const overdueReminders = dueReminders.filter((reminder) => {
    const action = getLatestReminderAction(reminder);
    return !isFinishedAction(action);
  });

  const totalSchedules = schedules.length;
  const activeSchedules = schedules.filter((schedule) =>
    (schedule.reminders || []).some((reminder) => reminder.status !== "CANCELED")
  ).length;
  const aiSchedules = schedules.filter((schedule) => schedule.sourceType === "AI_PROMPT").length;

  const weekStart = startOfDay(addDays(now, -6));
  const weekDays = Array.from({ length: 7 }, (_, index) => startOfDay(addDays(weekStart, index)));

  const weekly = weekDays.map((day) => {
    const start = startOfDay(day);
    const end = endOfDay(day);
    const dayReminders = reminders.filter((reminder) => reminder.startAt >= start && reminder.startAt <= end);
    const dayDone = dayReminders.filter((reminder) => getLatestReminderAction(reminder) === "DONE").length;
    const daySkipped = dayReminders.filter((reminder) => getLatestReminderAction(reminder) === "SKIPPED").length;
    const dayMissed = dayReminders.filter((reminder) => getLatestReminderAction(reminder) === "MISSED").length;

    return {
      date: toDateKey(day),
      label: formatDayLabel(day),
      total: dayReminders.length,
      done: dayDone,
      skipped: daySkipped,
      missed: dayMissed,
      completionRate: getRate(dayDone, dayReminders.length)
    };
  });

  let streakDays = 0;
  for (let index = weekly.length - 1; index >= 0; index -= 1) {
    const day = weekly[index];
    if (day.total === 0 || day.completionRate < 100) break;
    streakDays += 1;
  }

  const categories = Object.keys(categoryLabels).map((category) => {
    const categorySchedules = schedules.filter((schedule) => (schedule.category || "OTHER") === category);
    const categoryReminders = reminders.filter((reminder) => reminder.category === category);
    const categoryDone = categoryReminders.filter((reminder) => getLatestReminderAction(reminder) === "DONE").length;

    return {
      category,
      label: categoryLabels[category],
      schedules: categorySchedules.length,
      reminders: categoryReminders.length,
      done: categoryDone,
      completionRate: getRate(categoryDone, categoryReminders.length)
    };
  }).filter((item) => item.schedules > 0 || item.reminders > 0);

  const priorities = Object.keys(priorityLabels).map((priority) => {
    const priorityReminders = reminders.filter((reminder) => (reminder.priority || "NORMAL") === priority);
    const priorityDone = priorityReminders.filter((reminder) => getLatestReminderAction(reminder) === "DONE").length;

    return {
      priority,
      label: priorityLabels[priority],
      total: priorityReminders.length,
      done: priorityDone,
      completionRate: getRate(priorityDone, priorityReminders.length)
    };
  }).filter((item) => item.total > 0);

  const bestCategory = [...categories]
    .filter((item) => item.reminders > 0)
    .sort((a, b) => b.completionRate - a.completionRate || b.done - a.done)[0] || null;

  const completionRate = getRate(
    dueReminders.filter((reminder) => getLatestReminderAction(reminder) === "DONE").length,
    dueReminders.length
  );

  const routineProgressRate = getRate(doneReminders.length, reminders.length);
  const aiAdoptionRate = getRate(aiSchedules, totalSchedules);

  const insights = [
    totalSchedules === 0
      ? "Crie seu primeiro cronograma para liberar metricas reais."
      : `Voce tem ${totalSchedules} cronograma${totalSchedules === 1 ? "" : "s"} ativo${totalSchedules === 1 ? "" : "s"} no app.`,
    overdueReminders.length > 0
      ? `${overdueReminders.length} lembrete${overdueReminders.length === 1 ? "" : "s"} atrasado${overdueReminders.length === 1 ? "" : "s"} aguardando conclusao.`
      : reminders.length === 0
      ? "Adicione lembretes para calcular progresso e consistencia."
      : `Sua taxa de conclusao dos lembretes vencidos esta em ${completionRate}%.`,
    bestCategory
      ? `${bestCategory.label} e sua categoria mais consistente, com ${bestCategory.completionRate}% de conclusao.`
      : "Categorias aparecem aqui quando houver lembretes registrados.",
    aiSchedules > 0
      ? `${aiAdoptionRate}% dos seus cronogramas foram criados com apoio da IA.`
      : "Use a IA para transformar texto em cronogramas e comparar desempenho."
  ];

  return {
    summary: {
      totalSchedules,
      activeSchedules,
      totalReminders: reminders.length,
      dueReminders: dueReminders.length,
      doneReminders: doneReminders.length,
      pendingReminders: overdueReminders.length,
      overdueReminders: overdueReminders.length,
      skippedReminders: skippedReminders.length,
      missedReminders: missedReminders.length,
      snoozedReminders: snoozedReminders.length,
      completionRate,
      routineProgressRate,
      aiSchedules,
      aiAdoptionRate,
      streakDays,
      bestCategory: bestCategory?.label || null
    },
    weekly,
    categories,
    priorities,
    insights
  };
}

export function buildCollaborationDashboardMetrics(groups: CollaborationGroupForMetrics[]) {
  const groupMetrics = groups.map((group) => {
    const schedules = group.schedules || [];
    const metrics = buildDashboardMetrics(schedules);
    const reminders = schedules.flatMap((schedule) => schedule.reminders || []);
    const contributionMap = new Map<string, {
      userId: string;
      name: string;
      role: string;
      done: number;
    }>();

    for (const member of group.members || []) {
      contributionMap.set(member.userId, {
        userId: member.userId,
        name: member.user?.name || "Membro",
        role: member.role,
        done: 0
      });
    }

    for (const reminder of reminders) {
      const doneLog = getLatestDoneLog(reminder);
      const doneUserId = doneLog?.userId || doneLog?.user?.id;

      if (!doneUserId) {
        continue;
      }

      const current = contributionMap.get(doneUserId) || {
        userId: doneUserId,
        name: doneLog?.user?.name || "Membro",
        role: "MEMBER",
        done: 0
      };

      contributionMap.set(doneUserId, {
        ...current,
        done: current.done + 1
      });
    }

    const comments = reminders.reduce((total, reminder) => total + (reminder.comments?.length || 0), 0);
    const topContributors = [...contributionMap.values()]
      .sort((a, b) => b.done - a.done || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, 5);

    return {
      groupId: group.id,
      groupName: group.name,
      description: group.description || null,
      members: group.members?.length || 0,
      schedules: schedules.length,
      comments,
      summary: metrics.summary,
      weekly: metrics.weekly,
      topContributors,
      insights: metrics.insights
    };
  });

  const allSchedules = groups.flatMap((group) => group.schedules || []);
  const overall = buildDashboardMetrics(allSchedules);
  const totalComments = groupMetrics.reduce((total, group) => total + group.comments, 0);
  const activeGroups = groupMetrics.filter((group) => group.summary.totalReminders > 0).length;
  const bestGroup = [...groupMetrics]
    .filter((group) => group.summary.totalReminders > 0)
    .sort((a, b) =>
      b.summary.completionRate - a.summary.completionRate ||
      b.summary.doneReminders - a.summary.doneReminders
    )[0] || null;

  return {
    summary: {
      ...overall.summary,
      totalGroups: groups.length,
      activeGroups,
      totalComments
    },
    weekly: overall.weekly,
    groups: groupMetrics,
    insights: [
      groups.length === 0
        ? "Voce ainda nao participa de grupos colaborativos."
        : `Voce participa de ${groups.length} grupo${groups.length === 1 ? "" : "s"} colaborativo${groups.length === 1 ? "" : "s"}.`,
      activeGroups > 0
        ? `${activeGroups} grupo${activeGroups === 1 ? "" : "s"} tem tarefas cadastradas para acompanhar.`
        : "Crie tarefas em um grupo para liberar metricas colaborativas.",
      bestGroup
        ? `${bestGroup.groupName} e o grupo com melhor conclusao, em ${bestGroup.summary.completionRate}%.`
        : "A comparacao entre grupos aparece quando houver tarefas concluidas.",
      totalComments > 0
        ? `${totalComments} comentario${totalComments === 1 ? "" : "s"} registrado${totalComments === 1 ? "" : "s"} nas tarefas de grupo.`
        : "Comentarios de tarefa ajudam o grupo a registrar contexto e decisoes."
    ]
  };
}
