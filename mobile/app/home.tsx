import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { api } from "../src/services/api";
import { getDashboardMetricsRequest } from "../src/services/metrics";
import { getDailyInsightsRequest, getWeekRemindersRequest, DailyInsights } from "../src/services/dailyInsights";
import { useAuth } from "../src/context/AuthContext";
import { DashboardMetrics } from "../src/types/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { formatLongDate, getPeriodFromDate } from "../src/utils/date";
import { Button, EmptyState, LoadingState, StatCard } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { ReminderCard } from "../src/components/ReminderCard";
import { SnoozePickerModal } from "../src/components/SnoozePickerModal";
import { IconSymbol } from "../src/components/IconSymbol";
import { ShareRoutineCard } from "../src/components/ShareRoutineCard";
import { createReminderLogRequest, snoozeReminderRequest } from "../src/services/reminders";
import { captureAndShare } from "../src/services/shareRoutine";
import { getUnreadCountRequest } from "../src/services/appNotifications";
import { useResponsive } from "../src/hooks/useResponsive";
import { useThemeMode } from "../src/context/ThemeContext";
import {
  countOverdueReminders,
  isReminderDone,
  isReminderOverdue,
  isReminderSkipped
} from "../src/utils/reminderStatus";
import ViewShot from "react-native-view-shot";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Reminder = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  startAt: string;
  priority?: string | null;
  alarmLevel?: string | null;
  location?: string | null;
  schedule?: { title?: string | null; category?: string | null } | null;
  logs?: Array<{ action: string; createdAt?: string | Date | null }>;
};

type ViewTab = "today" | "week";

const periods = ["Madrugada", "Manha", "Tarde", "Noite"];

function isTodayReminder(reminder: Reminder) {
  const date = new Date(reminder.startAt);
  const now = new Date();
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getWeekRange() {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const end = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { start, end };
}

function groupByDate(reminders: Reminder[]) {
  const map = new Map<string, Reminder[]>();
  for (const r of reminders) {
    const key = new Date(r.startAt).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries()).map(([label, data]) => ({ label, data }));
}

function trendIcon(trend: DailyInsights["trend"]) {
  if (trend === "up") return "trending-up";
  if (trend === "down") return "trending-down";
  return "minus";
}

function trendColor(trend: DailyInsights["trend"], theme: any) {
  if (trend === "up") return colors.success;
  if (trend === "down") return colors.danger;
  return theme.textMuted;
}

function tipTypeColor(type: string) {
  switch (type) {
    case "celebration": return { bg: colors.successSoft, icon: colors.success };
    case "warning": return { bg: colors.dangerSoft, icon: colors.danger };
    case "pattern": return { bg: colors.primarySoft, icon: colors.primary };
    default: return { bg: "#EEF2FF", icon: "#4F46E5" };
  }
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { width, isPhone, isSmallPhone, isPhoneLarge, gap } = useResponsive();
  const { theme, isDark } = useThemeMode();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [weekReminders, setWeekReminders] = useState<Reminder[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardMetrics["summary"] | null>(null);
  const [insights, setInsights] = useState<DailyInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("today");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OVERDUE" | "PENDING" | "DONE">("ALL");
  const [isSharing, setIsSharing] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<Reminder | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const shareCardRef = useRef<any>(null);

  const isMobileLayout = isPhone || isSmallPhone;
  const isCompact = isPhone || isPhoneLarge;

  useEffect(() => {
    getUnreadCountRequest().then(setUnreadCount).catch(() => {});
  }, []);

  async function loadInsights() {
    if (isLoadingInsights) return;
    try {
      setIsLoadingInsights(true);
      setInsightsError(false);
      const res = await getDailyInsightsRequest();
      setInsights(res.insights);
    } catch {
      setInsightsError(true);
    } finally {
      setIsLoadingInsights(false);
    }
  }

  async function handleShare() {
    try {
      setIsSharing(true);
      await captureAndShare(shareCardRef as any);
    } catch (error: any) {
      Alert.alert("Não foi possível compartilhar", error?.message || "Tente novamente.");
    } finally {
      setIsSharing(false);
    }
  }

  const loadTodayReminders = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get("/reminders/today");
      setReminders(response.data.reminders || []);

      try {
        const metrics = await getDashboardMetricsRequest();
        setDashboardSummary(metrics.summary);
      } catch {}
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar os lembretes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function loadWeekReminders() {
    try {
      setIsLoadingWeek(true);
      const { start, end } = getWeekRange();
      const data = await getWeekRemindersRequest(start, end);
      setWeekReminders(data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a semana.");
    } finally {
      setIsLoadingWeek(false);
    }
  }

  useFocusEffect(useCallback(() => {
    loadTodayReminders();
    loadInsights();
  }, [loadTodayReminders]));

  useEffect(() => {
    if (activeTab === "week" && weekReminders.length === 0) {
      loadWeekReminders();
    }
  }, [activeTab]);

  const filteredTodayReminders = useMemo(() => {
    if (activeFilter === "DONE") return reminders.filter(isReminderDone);
    if (activeFilter === "OVERDUE") return reminders.filter(isReminderOverdue);
    if (activeFilter === "PENDING") return reminders.filter((r) => !isReminderDone(r) && !isReminderSkipped(r));
    return reminders;
  }, [activeFilter, reminders]);

  const groupedToday = useMemo(() => {
    return periods
      .map((period) => ({ period, data: filteredTodayReminders.filter((r) => getPeriodFromDate(r.startAt) === period) }))
      .filter((g) => g.data.length > 0);
  }, [filteredTodayReminders]);

  const groupedWeek = useMemo(() => groupByDate(weekReminders), [weekReminders]);

  const doneCount = reminders.filter(isReminderDone).length;
  const todayCount = reminders.filter(isTodayReminder).length;
  const overdueCount = countOverdueReminders(reminders);

  function applyLocalAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED", startAt?: string) {
    const createdAt = new Date().toISOString();
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === reminderId
          ? { ...reminder, startAt: startAt || reminder.startAt, logs: [{ action, createdAt }, ...(reminder.logs || [])] }
          : reminder
      )
    );
  }

  async function registerAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED", minutes?: number, label?: string) {
    try {
      const reminder = reminders.find((item) => item.id === reminderId);

      if (action === "SNOOZED" && reminder) {
        if (minutes === undefined) { setSnoozeTarget(reminder); return; }
        const result = await snoozeReminderRequest(reminder, minutes);
        applyLocalAction(reminderId, action, result.snoozedStartAt);
        Alert.alert(
          result.queued ? "Adiado offline" : "Tarefa adiada",
          result.queued
            ? "A tarefa foi adiada localmente e sera sincronizada quando a internet voltar."
            : result.alarmScheduled
            ? `Vou te lembrar novamente em ${label || `${minutes} min`}.`
            : "A tarefa foi adiada, mas nao consegui agendar a notificacao local."
        );
        if (!result.queued) await loadTodayReminders(true);
        return;
      }

      const result = await createReminderLogRequest(reminderId, {
        action,
        note: action === "DONE" ? "Marcado como feito pelo app." : "Pulado pelo app."
      });
      applyLocalAction(reminderId, action);

      if (result.queued) {
        Alert.alert("Salvo offline", "A acao sera sincronizada quando a internet voltar.");
        return;
      }
      await loadTodayReminders(true);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel atualizar o lembrete.");
    }
  }

  return (
    <ScreenLayout scroll={true}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title={`Ola, ${user?.name?.split(" ")[0] || "você"}!`}
            subtitle={formatLongDate()}
            onMenu={isWide ? undefined : openMenu}
            right={
              <View style={styles.headerActions}>
                <Pressable
                  style={[styles.headerBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary }, (isSharing || reminders.length === 0) && { opacity: 0.45 }]}
                  onPress={handleShare}
                  disabled={isSharing || reminders.length === 0}
                >
                  <IconSymbol name="share-variant-outline" size={18} color={theme.primary} />
                  <Text style={[styles.headerBtnLabel, { color: theme.primary }]}>
                    {isSharing ? "..." : "Compartilhar"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.notificationButton, { backgroundColor: theme.surface, borderColor: theme.border }, isSmallPhone && styles.notificationButtonSmall]}
                  onPress={() => router.push("/notifications")}
                >
                  <IconSymbol name="bell-outline" size={20} color={theme.text} />
                  {unreadCount > 0 && (
                    <View style={styles.notificationDot}>
                      <Text style={styles.notificationDotText}>{unreadCount > 99 ? "99+" : String(unreadCount)}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            }
          />

          {/* Stats */}
          <View style={[styles.stats, { gap }]}>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Hoje" value={todayCount} iconName="calendar-check-outline" caption="Compromissos" />
            </View>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Atrasadas" value={overdueCount} iconName="alert-circle-outline" tone="danger" caption="sem conclusao" />
            </View>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Feitos" value={doneCount} iconName="check-decagram-outline" tone="green" caption="Concluidos" />
            </View>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Sequencia" value={dashboardSummary?.streakDays || 0} iconName="chart-timeline-variant" tone="violet" caption="dias 100%" />
            </View>
          </View>

          {/* AI Insights */}
          <View style={[styles.insightsCard, { backgroundColor: theme.surface, borderColor: insights ? theme.primary : theme.border }]}>
            <Pressable
              style={styles.insightsHeader}
              onPress={() => {
                const opening = !insightsExpanded;
                setInsightsExpanded(opening);
                if (opening && !insights && !isLoadingInsights) {
                  loadInsights();
                }
              }}
            >
              <View style={styles.insightsHeaderLeft}>
                <View style={[styles.insightsOrb, { backgroundColor: isDark ? "#1E2D4A" : "#EEF2FF" }]}>
                  <IconSymbol name="brain" size={20} color="#4F46E5" />
                </View>
                <View style={styles.insightsHeaderText}>
                  <Text style={[styles.insightsTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>
                    Análise da IA
                  </Text>
                  {isLoadingInsights ? (
                    <Text style={[styles.insightsSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                      Analisando sua rotina...
                    </Text>
                  ) : insightsError ? (
                    <Text style={[styles.insightsSubtitle, { color: colors.danger, fontSize: scaledFont(12, width) }]}>
                      Falha ao carregar — toque para tentar novamente
                    </Text>
                  ) : insights ? (
                    <Text style={[styles.insightsSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                      {insights.headline}
                    </Text>
                  ) : (
                    <Text style={[styles.insightsSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                      Toque para ver suas dicas do dia
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.insightsHeaderRight}>
                {isLoadingInsights ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : insights ? (
                  <>
                    <View style={[styles.scoreChip, { backgroundColor: isDark ? "#1A2D1A" : colors.successSoft }]}>
                      <IconSymbol name={trendIcon(insights.trend)} size={14} color={trendColor(insights.trend, theme)} />
                      <Text style={[styles.scoreText, { color: trendColor(insights.trend, theme), fontSize: scaledFont(13, width) }]}>
                        {insights.score}
                      </Text>
                    </View>
                    <IconSymbol name={insightsExpanded ? "chevron-up" : "chevron-down"} size={18} color={theme.textMuted} />
                  </>
                ) : insightsError ? (
                  <IconSymbol name="refresh" size={18} color={colors.danger} />
                ) : (
                  <IconSymbol name="chevron-down" size={18} color={theme.textMuted} />
                )}
              </View>
            </Pressable>

            {insightsExpanded && (
              <View style={[styles.insightsTips, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                {isLoadingInsights ? (
                  <View style={styles.insightsStateRow}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.insightsStateText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                      A IA está analisando sua rotina...
                    </Text>
                  </View>
                ) : insightsError ? (
                  <View style={styles.insightsStateRow}>
                    <IconSymbol name="alert-circle-outline" size={20} color={colors.danger} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.insightsStateText, { color: theme.text, fontSize: scaledFont(13, width) }]}>
                        Não foi possível gerar a análise.
                      </Text>
                      <Pressable onPress={loadInsights} style={styles.retryBtn}>
                        <Text style={[styles.retryBtnText, { color: theme.primary, fontSize: scaledFont(12, width) }]}>
                          Tentar novamente
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : insights ? (
                  insights.tips.map((tip, i) => {
                    const tc = tipTypeColor(tip.type);
                    return (
                      <View key={i} style={[styles.tipRow, { borderColor: theme.border }]}>
                        <View style={[styles.tipIconBox, { backgroundColor: tc.bg }]}>
                          <IconSymbol name={tip.icon as any} size={18} color={tc.icon} />
                        </View>
                        <View style={styles.tipBody}>
                          <Text style={[styles.tipTitle, { color: theme.text, fontSize: scaledFont(13, width) }]}>
                            {tip.title}
                          </Text>
                          <Text style={[styles.tipText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                            {tip.text}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : null}
              </View>
            )}
          </View>

          {/* Overdue notice */}
          {overdueCount > 0 && (
            <Pressable
              style={[styles.overdueNotice, isMobileLayout && styles.overdueNoticeMobile]}
              onPress={() => setActiveFilter("OVERDUE")}
            >
              <View style={styles.overdueNoticeIcon}>
                <IconSymbol name="alert" size={20} color={colors.white} />
              </View>
              <View style={styles.overdueNoticeCopy}>
                <Text style={[styles.overdueNoticeTitle, { fontSize: scaledFont(14, width) }]}>
                  {overdueCount} {overdueCount === 1 ? "atividade atrasada" : "atividades atrasadas"}
                </Text>
                <Text style={[styles.overdueNoticeText, { fontSize: scaledFont(12, width) }]}>
                  Pendentes de conclusao ou decisao.
                </Text>
              </View>
            </Pressable>
          )}

          {/* Quick actions */}
          <Text style={[styles.sectionLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>Ações rápidas</Text>
          <View style={[styles.quickGrid, { gap }]}>
            <Pressable style={[styles.quickCard, styles.quickCardPrimary, isMobileLayout && styles.quickCardMobile]} onPress={() => router.push("/ai-prompt")}>
              <View style={styles.quickIconPrimary}><IconSymbol name="auto-fix" size={20} color={colors.white} /></View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitlePrimary, { fontSize: scaledFont(14, width) }]}>Criar com IA</Text>
                <Text style={[styles.quickSubtitlePrimary, { fontSize: scaledFont(12, width) }]}>Transforme texto em cronograma</Text>
              </View>
            </Pressable>
            <Pressable style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }, isMobileLayout && styles.quickCardMobile]} onPress={() => router.push("/meu-dia")}>
              <View style={styles.quickIcon}><IconSymbol name="brain" size={20} color={theme.primary} /></View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Meu Dia</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Próxima tarefa + foco</Text>
              </View>
            </Pressable>
            <Pressable style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }, isMobileLayout && styles.quickCardMobile]} onPress={() => router.push("/schedules/new")}>
              <View style={styles.quickIcon}><IconSymbol name="plus" size={20} color={theme.primary} /></View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Novo cronograma</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Criar manualmente</Text>
              </View>
            </Pressable>
            <Pressable style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }, isMobileLayout && styles.quickCardMobile]} onPress={() => router.push("/schedules")}>
              <View style={styles.quickIcon}><IconSymbol name="format-list-checks" size={20} color={theme.primary} /></View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Ver cronogramas</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Gerenciar rotinas</Text>
              </View>
            </Pressable>
            <Pressable style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }, isMobileLayout && styles.quickCardMobile]} onPress={() => router.push("/dashboard")}>
              <View style={styles.quickIcon}><IconSymbol name="chart-box-outline" size={20} color={theme.primary} /></View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Dashboard</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Ver métricas reais</Text>
              </View>
            </Pressable>
          </View>

          {/* Tab switcher: Hoje / Semana */}
          <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {([{ key: "today", label: "Hoje" }, { key: "week", label: "Esta semana" }] as const).map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && { backgroundColor: theme.primary }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.white : theme.textMuted, fontSize: scaledFont(13, width) }]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Hoje view */}
          {activeTab === "today" && (
            <>
              <View style={[styles.filtersRow, { gap: spacing.sm }]}>
                {([
                  { key: "ALL", label: "Todos" },
                  { key: "OVERDUE", label: "Atrasados" },
                  { key: "PENDING", label: "Pendentes" },
                  { key: "DONE", label: "Feitos" }
                ] as const).map((item) => (
                  <Pressable
                    key={item.key}
                    style={[
                      styles.filter,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      activeFilter === item.key && { backgroundColor: theme.primary, borderColor: theme.primary },
                      isSmallPhone && styles.filterSmall
                    ]}
                    onPress={() => setActiveFilter(item.key)}
                  >
                    <Text style={[styles.filterText, { color: activeFilter === item.key ? colors.white : theme.textMuted, fontSize: scaledFont(12, width) }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isLoading ? (
                <LoadingState label="Organizando seus lembretes..." />
              ) : (
                <View style={styles.timeline}>
                  {groupedToday.length === 0 ? (
                    <EmptyState
                      iconName="calendar-blank-outline"
                      title="Nada por aqui"
                      description="Voce ainda nao possui lembretes para este filtro."
                      action={<Button title="Criar com IA" icon="auto-fix" onPress={() => router.push("/ai-prompt")} fullWidth />}
                    />
                  ) : (
                    groupedToday.map((group) => (
                      <View key={group.period} style={styles.periodBlock}>
                        <View style={styles.periodHeader}>
                          <Text style={[styles.periodTitle, { fontSize: scaledFont(16, width) }]}>{group.period}</Text>
                          <Text style={[styles.periodCount, { fontSize: scaledFont(11, width) }]}>
                            {group.data.length} {group.data.length === 1 ? "alarme" : "alarmes"}
                          </Text>
                        </View>
                        {group.data.map((reminder) => (
                          <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onDone={() => registerAction(reminder.id, "DONE")}
                            onSnooze={() => registerAction(reminder.id, "SNOOZED")}
                            onSkip={() => registerAction(reminder.id, "SKIPPED")}
                          />
                        ))}
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}

          {/* Semana view */}
          {activeTab === "week" && (
            <View style={styles.timeline}>
              {isLoadingWeek ? (
                <LoadingState label="Carregando a semana..." />
              ) : groupedWeek.length === 0 ? (
                <EmptyState
                  iconName="calendar-week-outline"
                  title="Nenhuma tarefa esta semana"
                  description="Crie um cronograma para os próximos dias."
                  action={<Button title="Criar com IA" icon="auto-fix" onPress={() => router.push("/ai-prompt")} fullWidth />}
                />
              ) : (
                groupedWeek.map(({ label, data }) => (
                  <View key={label} style={styles.periodBlock}>
                    <View style={styles.periodHeader}>
                      <Text style={[styles.periodTitle, { fontSize: scaledFont(15, width), textTransform: "capitalize" }]}>{label}</Text>
                      <Text style={[styles.periodCount, { fontSize: scaledFont(11, width) }]}>
                        {data.length} {data.length === 1 ? "tarefa" : "tarefas"}
                      </Text>
                    </View>
                    {data.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onDone={() => registerAction(reminder.id, "DONE")}
                        onSnooze={() => registerAction(reminder.id, "SNOOZED")}
                        onSkip={() => registerAction(reminder.id, "SKIPPED")}
                      />
                    ))}
                  </View>
                ))
              )}
            </View>
          )}

          <View style={styles.offscreen}>
            <ViewShot ref={shareCardRef} options={{ format: "png", quality: 1 }}>
              <ShareRoutineCard
                userName={user?.name || "Usuario"}
                date={formatLongDate()}
                reminders={reminders}
                doneCount={reminders.filter(isReminderDone).length}
                totalCount={reminders.length}
                streakDays={dashboardSummary?.streakDays || 0}
              />
            </ViewShot>
          </View>
          <SnoozePickerModal
            visible={snoozeTarget !== null}
            onClose={() => setSnoozeTarget(null)}
            onConfirm={(minutes, label) => {
              if (snoozeTarget) registerAction(snoozeTarget.id, "SNOOZED", minutes, label);
              setSnoozeTarget(null);
            }}
          />
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", minWidth: 0 },
  offscreen: { position: "absolute", left: -9999, top: 0 },

  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerBtn: {
    height: 42, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 6, paddingHorizontal: spacing.md
  },
  headerBtnLabel: { fontFamily: fonts.bold, fontSize: 13 },

  notificationButton: {
    width: 42, height: 42, borderRadius: 14,
    borderWidth: 1, alignItems: "center", justifyContent: "center", position: "relative"
  },
  notificationButtonSmall: { width: 38, height: 38, borderRadius: 12 },
  notificationDot: {
    position: "absolute", top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center"
  },
  notificationDotText: { color: colors.white, fontFamily: fonts.bold, fontSize: 10 },

  stats: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.lg },
  statItem: { flexGrow: 1, flexBasis: 140, minWidth: 130 },
  statItemSmall: { flexBasis: "48%", minWidth: 0 },

  // AI Insights
  insightsCard: {
    borderRadius: radius.lg, borderWidth: 1.5,
    marginBottom: spacing.lg, overflow: "hidden"
  },
  insightsHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", padding: spacing.md, gap: spacing.sm
  },
  insightsHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.sm },
  insightsHeaderRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  insightsOrb: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center"
  },
  insightsHeaderText: { flex: 1 },
  insightsTitle: { fontFamily: fonts.bold },
  insightsSubtitle: { fontFamily: fonts.regular, marginTop: 2 },
  scoreChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill
  },
  scoreText: { fontFamily: fonts.title },
  insightsTips: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  insightsStateRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm, paddingVertical: spacing.md
  },
  insightsStateText: { fontFamily: fonts.medium, flex: 1 },
  retryBtn: { marginTop: spacing.xs },
  retryBtnText: { fontFamily: fonts.bold },
  tipRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1
  },
  tipIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  tipBody: { flex: 1 },
  tipTitle: { fontFamily: fonts.bold, marginBottom: 2 },
  tipText: { fontFamily: fonts.regular, lineHeight: 17 },

  overdueNotice: {
    minHeight: 74, borderRadius: radius.lg, borderWidth: 1,
    borderColor: "#FECDD6", backgroundColor: "#FFF7F8",
    padding: spacing.md, marginBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.md, ...shadow.soft
  },
  overdueNoticeMobile: { alignItems: "flex-start" },
  overdueNoticeIcon: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center"
  },
  overdueNoticeCopy: { flex: 1, minWidth: 0 },
  overdueNoticeTitle: { color: colors.danger, fontFamily: fonts.bold },
  overdueNoticeText: { color: colors.textMuted, fontFamily: fonts.medium, marginTop: 2 },

  sectionLabel: { fontFamily: fonts.bold, marginBottom: spacing.md },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.xl },
  quickCard: {
    flexGrow: 1, flexBasis: 200, minWidth: 0, minHeight: 76,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
    flexDirection: "row", alignItems: "center", gap: spacing.md, ...shadow.soft
  },
  quickCardMobile: { flexBasis: "100%", minHeight: 68 },
  quickCardPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  quickIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center"
  },
  quickIconPrimary: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center"
  },
  quickTextBox: { flex: 1, minWidth: 0 },
  quickTitle: { fontFamily: fonts.bold },
  quickSubtitle: { fontFamily: fonts.regular, marginTop: 2 },
  quickTitlePrimary: { color: colors.white, fontFamily: fonts.bold },
  quickSubtitlePrimary: { color: "rgba(255,255,255,0.8)", fontFamily: fonts.regular, marginTop: 2 },

  tabRow: {
    flexDirection: "row", borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.xs, marginBottom: spacing.md, gap: spacing.xs
  },
  tab: {
    flex: 1, height: 38, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center"
  },
  tabText: { fontFamily: fonts.bold },

  filtersRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.md },
  filter: {
    height: 36, borderRadius: radius.pill, paddingHorizontal: spacing.md,
    borderWidth: 1, alignItems: "center", justifyContent: "center"
  },
  filterSmall: { height: 32, paddingHorizontal: spacing.sm },
  filterText: { fontFamily: fonts.bold },

  timeline: { gap: spacing.md, paddingBottom: spacing.xxxl },
  periodBlock: { marginBottom: spacing.lg },
  periodHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: spacing.sm, gap: spacing.md
  },
  periodTitle: { color: colors.text, fontFamily: fonts.title },
  periodCount: { color: colors.textMuted, fontFamily: fonts.bold }
});
