import { useCallback, useMemo, useState } from "react";
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
import { useResponsive } from "../src/hooks/useResponsive";
import {
  countOverdueReminders,
  isReminderDone,
  isReminderOverdue,
  isReminderSkipped
} from "../src/utils/reminderStatus";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";

type Reminder = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  startAt: string;
  priority?: string | null;
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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardMetrics["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "OVERDUE" | "PENDING" | "DONE">("ALL");

  const isMobileLayout = isPhone || isSmallPhone;
  const isCompact = isPhone || isPhoneLarge;

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

  async function registerAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED") {
    try {
      await api.post(`/reminders/${reminderId}/log`, {
        action,
        note: action === "DONE" ? "Marcado como feito pelo app." : action === "SNOOZED" ? "Adiado pelo app." : "Pulado pelo app."
      });
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
              <Pressable
                style={[styles.notificationButton, isSmallPhone && styles.notificationButtonSmall]}
                onPress={() => router.push("/settings")}
              >
                <Text style={styles.notificationText}>S</Text>
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationDotText}>3</Text>
                </View>
              </Pressable>
            }
          />

          {/* Hero Section */}
          <View style={[styles.hero, isMobileLayout && styles.heroMobile]}>
            <View style={[styles.aiOrb, isMobileLayout && styles.aiOrbMobile]}>
              <Text style={[styles.aiOrbText, { fontSize: scaledFont(isMobileLayout ? 18 : 22, width) }]}>AI</Text>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroKickerRow}>
                <View style={styles.heroKickerBadge}>
                  <Text style={[styles.heroKicker, { fontSize: scaledFont(10, width) }]}>ASSISTENTE DE ROTINA AI</Text>
                </View>
              </View>
              <Text style={[styles.heroTitle, { fontSize: scaledFont(isMobileLayout ? 18 : 22, width) }]}>
                Sua rotina em modo inteligente.
              </Text>
              <Text style={[styles.heroText, { fontSize: scaledFont(13, width) }]}>
                Acompanhe seus lembretes, marque o que foi feito e deixe a IA te ajudar a manter o foco.
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={[styles.stats, { gap }]}>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Hoje" value={todayCount} icon="T" caption="Compromissos" />
            </View>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Atrasadas" value={overdueCount} icon="!" tone="danger" caption="sem conclusao" />
            </View>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Feitos" value={doneCount} icon="V" tone="green" caption="Concluidos" />
            </View>
            <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
              <StatCard title="Sequencia" value={dashboardSummary?.streakDays || 0} icon="S" tone="violet" caption="dias 100%" />
            </View>
          </View>

          {overdueCount > 0 ? (
            <Pressable
              style={[styles.overdueNotice, isMobileLayout && styles.overdueNoticeMobile]}
              onPress={() => setActiveFilter("OVERDUE")}
            >
              <View style={styles.overdueNoticeIcon}>
                <Text style={styles.overdueNoticeIconText}>!</Text>
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
          <Text style={[styles.sectionLabel, { fontSize: scaledFont(14, width) }]}>Acoes rapidas</Text>

          <View style={[styles.quickGrid, { gap }]}>
            <Pressable
              style={[styles.quickCard, styles.quickCardPrimary, isMobileLayout && styles.quickCardMobile]}
              onPress={() => router.push("/ai-prompt")}
            >
              <View style={styles.quickIconPrimary}>
                <Text style={styles.quickIconPrimaryText}>AI</Text>
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitlePrimary, { fontSize: scaledFont(14, width) }]}>Criar com IA</Text>
                <Text style={[styles.quickSubtitlePrimary, { fontSize: scaledFont(12, width) }]}>
                  Transforme texto em cronograma
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.quickCard, isMobileLayout && styles.quickCardMobile]}
              onPress={() => router.push("/schedules/new")}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickIconText}>+</Text>
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { fontSize: scaledFont(14, width) }]}>Novo cronograma</Text>
                <Text style={[styles.quickSubtitle, { fontSize: scaledFont(12, width) }]}>Criar manualmente</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.quickCard, isMobileLayout && styles.quickCardMobile]}
              onPress={() => router.push("/schedules")}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickIconText}>L</Text>
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { fontSize: scaledFont(14, width) }]}>Ver cronogramas</Text>
                <Text style={[styles.quickSubtitle, { fontSize: scaledFont(12, width) }]}>Gerenciar rotinas</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.quickCard, isMobileLayout && styles.quickCardMobile]}
              onPress={() => router.push("/dashboard")}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickIconText}>D</Text>
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { fontSize: scaledFont(14, width) }]}>Dashboard</Text>
                <Text style={[styles.quickSubtitle, { fontSize: scaledFont(12, width) }]}>Ver metricas reais</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.quickCard, isMobileLayout && styles.quickCardMobile]}
              onPress={() => router.push("/settings")}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickIconText}>A</Text>
              </View>
              <View style={styles.quickTextBox}>
                <Text style={[styles.quickTitle, { fontSize: scaledFont(14, width) }]}>Testar alarme</Text>
                <Text style={[styles.quickSubtitle, { fontSize: scaledFont(12, width) }]}>Enviar teste agora</Text>
              </View>
            </Pressable>
          </View>

          {/* Today Section */}
          <View style={[styles.todayHeader, isMobileLayout && styles.todayHeaderMobile]}>
            <View style={styles.todayTitleRow}>
              <Text style={[styles.todayTitle, { fontSize: scaledFont(20, width) }]}>Hoje e atrasadas</Text>
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
                    activeFilter === item.key && styles.filterActive,
                    isSmallPhone && styles.filterSmall
                  ]}
                  onPress={() => setActiveFilter(item.key as any)}
                >
                  <Text
                    style={[
                      styles.filterText,
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
                  icon="*"
                  title="Nada por aqui"
                  description="Voce ainda nao possui lembretes para este filtro. Crie um cronograma manual ou gere uma rotina com IA."
                  action={
                    <Button
                      title="Criar com IA"
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
