import { useCallback, useMemo, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { api } from "../src/services/api";
import { getDashboardMetricsRequest } from "../src/services/metrics";
import { useAuth } from "../src/context/AuthContext";
import { DashboardMetrics } from "../src/types/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { formatLongDate, getPeriodFromDate } from "../src/utils/date";
import { Button, EmptyState, LoadingState, StatCard } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { ReminderCard } from "../src/components/ReminderCard";
import { AiBadge, AiPanel } from "../src/components/AiVisual";
import { IconSymbol } from "../src/components/IconSymbol";
import { ShareRoutineCard } from "../src/components/ShareRoutineCard";
import { createReminderLogRequest, snoozeReminderRequest } from "../src/services/reminders";
import { captureAndShare } from "../src/services/shareRoutine";
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

export default function HomeScreen() {
  const { user } = useAuth();
  const { width, isPhone, isSmallPhone, isPhoneLarge, gap, paddingHorizontal } = useResponsive();
  const { theme } = useThemeMode();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardMetrics["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OVERDUE" | "PENDING" | "DONE">("ALL");
  const [isSharing, setIsSharing] = useState(false);
  const shareCardRef = useRef<any>(null);

  const isMobileLayout = isPhone || isSmallPhone;
  const isCompact = isPhone || isPhoneLarge;

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
      } catch (metricsError: any) {
        console.log("[HOME METRICS ERROR]", metricsError?.response?.data || metricsError);
      }
    } catch (error: any) {
      console.log("[HOME ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar os lembretes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTodayReminders(); }, [loadTodayReminders]));

  const filteredReminders = useMemo(() => {
    if (activeFilter === "DONE") return reminders.filter(isReminderDone);
    if (activeFilter === "OVERDUE") return reminders.filter(isReminderOverdue);
    if (activeFilter === "PENDING") {
      return reminders.filter((reminder) => !isReminderDone(reminder) && !isReminderSkipped(reminder));
    }
    return reminders;
  }, [activeFilter, reminders]);

  const grouped = useMemo(() => {
    return periods
      .map((period) => ({ period, data: filteredReminders.filter((reminder) => getPeriodFromDate(reminder.startAt) === period) }))
      .filter((group) => group.data.length > 0);
  }, [filteredReminders]);

  const doneCount = reminders.filter(isReminderDone).length;
  const todayCount = reminders.filter(isTodayReminder).length;
  const overdueCount = countOverdueReminders(reminders);

  function applyLocalAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED", startAt?: string) {
    const createdAt = new Date().toISOString();

    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === reminderId
          ? {
              ...reminder,
              startAt: startAt || reminder.startAt,
              logs: [
                { action, createdAt },
                ...(reminder.logs || [])
              ]
            }
          : reminder
      )
    );
  }

  async function registerAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED") {
    try {
      const reminder = reminders.find((item) => item.id === reminderId);

      if (action === "SNOOZED" && reminder) {
        const result = await snoozeReminderRequest(reminder, 10);
        applyLocalAction(reminderId, action, result.snoozedStartAt);

        Alert.alert(
          result.queued ? "Adiado offline" : "Soneca ativada",
          result.queued
            ? "A tarefa foi adiada localmente e sera sincronizada quando a internet voltar."
            : result.alarmScheduled
            ? "Vou te lembrar novamente em 10 minutos."
            : "A tarefa foi adiada, mas nao consegui agendar a notificacao local."
        );

        if (!result.queued) {
          await loadTodayReminders(true);
        }
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
      console.log("[REMINDER ACTION ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel atualizar o lembrete.");
    }
  }

  return (
    <ScreenLayout scroll={true}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title={`Ola, ${user?.name?.split(" ")[0] || "Will"}!`}
            subtitle={formatLongDate()}
            onMenu={isWide ? undefined : openMenu}
            right={
              <View style={styles.headerActions}>
                <Pressable
                  style={[
                    styles.headerBtn,
                    { backgroundColor: theme.primarySoft, borderColor: theme.primary },
                    (isSharing || reminders.length === 0) && { opacity: 0.45 }
                  ]}
                  onPress={handleShare}
                  disabled={isSharing || reminders.length === 0}
                >
                  <IconSymbol name="share-variant-outline" size={18} color={theme.primary} />
                  <Text style={[styles.headerBtnLabel, { color: theme.primary }]}>
                    {isSharing ? "..." : "Compartilhar"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.notificationButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSmallPhone && styles.notificationButtonSmall
                  ]}
                  onPress={() => router.push("/settings")}
                >
                  <IconSymbol name="cog-outline" size={20} color={theme.text} />
                  <View style={styles.notificationDot}>
                    <Text style={styles.notificationDotText}>3</Text>
                  </View>
                </Pressable>
              </View>
            }
          />

          <AiPanel
            title="Sua rotina em modo inteligente."
            description="Acompanhe lembretes, conclua tarefas e deixe a IA organizar o proximo passo do dia."
            icon="robot-outline"
            metric={`${doneCount}/${Math.max(todayCount, 1)}`}
            metricLabel="feitos hoje"
            compact={isMobileLayout}
            style={styles.heroPanel}
          >
            <View style={styles.heroBadges}>
              <AiBadge label={`${overdueCount} atrasadas`} tone={overdueCount > 0 ? "amber" : "green"} />
              <AiBadge label={`${dashboardSummary?.streakDays || 0} dias de sequencia`} tone="violet" />
            </View>
          </AiPanel>

          {/* Stats Grid */}
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

          {overdueCount > 0 ? (
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
          ) : null}

          {/* Quick Actions */}
          <Text style={[styles.sectionLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>Acoes rapidas</Text>

          <View style={[styles.quickGrid, { gap }]}>
            <Pressable
              style={[styles.quickCard, styles.quickCardPrimary, isMobileLayout && styles.quickCardMobile]}
              onPress={() => router.push("/ai-prompt")}
            >
              <View style={styles.quickIconPrimary}>
                <IconSymbol name="auto-fix" size={20} color={colors.white} />
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitlePrimary, { fontSize: scaledFont(14, width) }]}>Criar com IA</Text>
                <Text style={[styles.quickSubtitlePrimary, { fontSize: scaledFont(12, width) }]}>
                  Transforme texto em cronograma
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.quickCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isMobileLayout && styles.quickCardMobile
              ]}
              onPress={() => router.push("/schedules/new")}
            >
              <View style={styles.quickIcon}>
                <IconSymbol name="plus" size={20} color={theme.primary} />
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Novo cronograma</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Criar manualmente</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.quickCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isMobileLayout && styles.quickCardMobile
              ]}
              onPress={() => router.push("/schedules")}
            >
              <View style={styles.quickIcon}>
                <IconSymbol name="format-list-checks" size={20} color={theme.primary} />
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Ver cronogramas</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Gerenciar rotinas</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.quickCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isMobileLayout && styles.quickCardMobile
              ]}
              onPress={() => router.push("/dashboard")}
            >
              <View style={styles.quickIcon}>
                <IconSymbol name="chart-box-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Dashboard</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Ver metricas reais</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.quickCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                isMobileLayout && styles.quickCardMobile
              ]}
              onPress={() => router.push("/settings")}
            >
              <View style={styles.quickIcon}>
                <IconSymbol name="bell-ring-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>Testar alarme</Text>
                <Text style={[styles.quickSubtitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Enviar teste agora</Text>
              </View>
            </Pressable>
          </View>

          {/* Today Section */}
          <View style={[styles.todayHeader, isMobileLayout && styles.todayHeaderMobile]}>
            <View style={styles.todayTitleRow}>
              <Text style={[styles.todayTitle, { color: theme.text, fontSize: scaledFont(20, width) }]}>Hoje e atrasadas</Text>
              <View style={styles.todayBadge}>
                <Text style={[styles.todayBadgeText, { fontSize: scaledFont(11, width) }]}>{todayCount} hoje</Text>
              </View>
              {overdueCount > 0 ? (
                <View style={styles.todayOverdueBadge}>
                  <Text style={[styles.todayOverdueBadgeText, { fontSize: scaledFont(11, width) }]}>
                    {overdueCount} atrasadas
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.filters, { gap: spacing.sm }]}>
              {[
                { key: "ALL", label: "Todos" },
                { key: "OVERDUE", label: "Atrasados" },
                { key: "PENDING", label: "Pendentes" },
                { key: "DONE", label: "Feitos" }
              ].map((item) => (
                <Pressable
                  key={item.key}
                  style={[
                    styles.filter,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    activeFilter === item.key && styles.filterActive,
                    activeFilter === item.key && { backgroundColor: theme.primary, borderColor: theme.primary },
                    isSmallPhone && styles.filterSmall
                  ]}
                  onPress={() => setActiveFilter(item.key as any)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: activeFilter === item.key ? theme.white : theme.textMuted },
                      activeFilter === item.key && styles.filterTextActive,
                      { fontSize: scaledFont(12, width) }
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reminders Timeline */}
          {isLoading ? (
            <LoadingState label="Organizando seus lembretes..." />
          ) : (
            <View style={styles.timeline}>
              {grouped.length === 0 ? (
                <EmptyState
                  iconName="calendar-blank-outline"
                  title="Nada por aqui"
                  description="Voce ainda nao possui lembretes para este filtro. Crie um cronograma manual ou gere uma rotina com IA."
                  action={
                    <Button
                      title="Criar com IA"
                      icon="auto-fix"
                      onPress={() => router.push("/ai-prompt")}
                      fullWidth
                    />
                  }
                />
              ) : (
                grouped.map((group) => (
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
        </View>
      )}

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    minWidth: 0
  },

  offscreen: {
    position: "absolute",
    left: -9999,
    top: 0
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },

  headerBtn: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing.md
  },
  headerBtnLabel: {
    fontFamily: fonts.bold,
    fontSize: 13
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  notificationButtonSmall: {
    width: 38,
    height: 38,
    borderRadius: 12
  },

  notificationText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 14
  },

  notificationDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center"
  },

  notificationDotText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 10
  },

  heroPanel: {
    marginBottom: spacing.lg
  },

  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },

  hero: {
    minHeight: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    overflow: "hidden",
    ...shadow.soft
  },

  heroMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
    minHeight: "auto"
  },

  heroContent: {
    flex: 1,
    minWidth: 0
  },

  aiOrb: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    alignItems: "center",
    justifyContent: "center"
  },

  aiOrbMobile: {
    width: 56,
    height: 56,
    borderRadius: 18
  },

  aiOrbText: {
    color: colors.accent,
    fontFamily: fonts.title
  },

  heroKickerRow: {
    flexDirection: "row"
  },

  heroKickerBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3
  },

  heroKicker: {
    color: colors.primary,
    fontFamily: fonts.bold,
    letterSpacing: 0.5
  },

  heroTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    marginTop: spacing.sm
  },

  heroText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.xs,
    maxWidth: 480
  },

  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg
  },

  statItem: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 130
  },
  statItemSmall: {
    flexBasis: "48%",
    minWidth: 0
  },

  overdueNotice: {
    minHeight: 74,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#FECDD6",
    backgroundColor: "#FFF7F8",
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow.soft
  },
  overdueNoticeMobile: {
    alignItems: "flex-start"
  },
  overdueNoticeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center"
  },
  overdueNoticeIconText: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 18
  },
  overdueNoticeCopy: {
    flex: 1,
    minWidth: 0
  },
  overdueNoticeTitle: {
    color: colors.danger,
    fontFamily: fonts.bold
  },
  overdueNoticeText: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    marginTop: 2
  },

  sectionLabel: {
    color: colors.text,
    fontFamily: fonts.bold,
    marginBottom: spacing.md
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xl
  },

  quickCard: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 0,
    minHeight: 76,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow.soft
  },

  quickCardMobile: {
    flexBasis: "100%",
    minHeight: 68
  },

  quickCardPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },

  quickIconText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 18
  },

  quickIconPrimary: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },

  quickIconPrimaryText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14
  },

  quickTextBox: {
    flex: 1,
    minWidth: 0
  },

  quickTitle: {
    color: colors.text,
    fontFamily: fonts.bold
  },

  quickSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginTop: 2
  },

  quickTitlePrimary: {
    color: colors.white,
    fontFamily: fonts.bold
  },

  quickSubtitlePrimary: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: fonts.regular,
    marginTop: 2
  },

  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md
  },

  todayHeaderMobile: {
    flexDirection: "column",
    alignItems: "flex-start"
  },

  todayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap"
  },

  todayTitle: {
    color: colors.text,
    fontFamily: fonts.title
  },

  todayBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3
  },

  todayBadgeText: {
    color: colors.primary,
    fontFamily: fonts.bold
  },

  todayOverdueBadge: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3
  },

  todayOverdueBadgeText: {
    color: colors.danger,
    fontFamily: fonts.bold
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap"
  },

  filter: {
    height: 36,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },

  filterSmall: {
    height: 32,
    paddingHorizontal: spacing.sm
  },

  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },

  filterText: {
    color: colors.textMuted,
    fontFamily: fonts.bold
  },

  filterTextActive: {
    color: colors.white
  },

  timeline: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl
  },

  periodBlock: {
    marginBottom: spacing.lg
  },

  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.md
  },

  periodTitle: {
    color: colors.text,
    fontFamily: fonts.title
  },

  periodCount: {
    color: colors.textMuted,
    fontFamily: fonts.bold
  }
});
