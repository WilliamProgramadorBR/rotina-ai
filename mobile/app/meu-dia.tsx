import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../src/services/api";
import { getDashboardMetricsRequest } from "../src/services/metrics";
import { useAuth } from "../src/context/AuthContext";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { formatLongDate, formatTime } from "../src/utils/date";
import { isReminderDone, isReminderOverdue, isReminderSkipped, countOverdueReminders } from "../src/utils/reminderStatus";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { PageHeader } from "../src/components/PageHeader";
import { IconSymbol } from "../src/components/IconSymbol";
import { LoadingState } from "../src/components/LoadingState";
import { ReminderCard } from "../src/components/ReminderCard";
import { DashboardMetrics } from "../src/types/api";

type Reminder = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  priority?: string | null;
  alarmLevel?: string | null;
  location?: string | null;
  schedule?: { title?: string | null; category?: string | null } | null;
  logs?: Array<{ action: string; createdAt?: string | Date | null }>;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getNextReminder(reminders: Reminder[]): Reminder | null {
  const now = Date.now();
  const upcoming = reminders
    .filter((r) => {
      const t = new Date(r.startAt).getTime();
      return t > now && !isReminderDone(r) && !isReminderSkipped(r);
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return upcoming[0] || null;
}

function buildDayReorganizePrompt(reminders: Reminder[]) {
  const pending = reminders.filter((reminder) => !isReminderDone(reminder) && !isReminderSkipped(reminder));
  const source = pending.length > 0 ? pending : reminders;

  if (source.length === 0) {
    return [
      "Monte uma rotina inteligente para o meu dia de hoje.",
      "Crie blocos realistas de foco, pausas e lembretes simples.",
      "Priorize uma rotina facil de cumprir e deixe espaco para imprevistos."
    ].join("\n");
  }

  const items = source.slice(0, 12).map((reminder, index) => {
    const status = isReminderOverdue(reminder) ? "atrasada" : "pendente";
    const schedule = reminder.schedule?.title ? ` - rotina: ${reminder.schedule.title}` : "";
    const description = reminder.description ? ` - contexto: ${reminder.description}` : "";

    return `${index + 1}. ${reminder.title} - horario atual: ${formatTime(reminder.startAt)} - status: ${status}${schedule}${description}`;
  });

  return [
    "Reorganize meu dia com IA usando as atividades abaixo.",
    "Distribua os horarios de forma realista, priorize o que esta atrasado e mantenha pausas curtas entre blocos.",
    "Nao duplique atividades concluidas ou puladas. Gere um cronograma revisavel com lembretes claros.",
    "",
    "Atividades:",
    ...items
  ].join("\n");
}

export default function MeuDiaScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useThemeMode();
  const { width, isPhone, isSmallPhone } = useResponsive();
  const isMobile = isPhone || isSmallPhone;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [summary, setSummary] = useState<DashboardMetrics["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplanning, setIsReplanning] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [remindersRes, metrics] = await Promise.allSettled([
        api.get("/reminders/today"),
        getDashboardMetricsRequest()
      ]);
      if (remindersRes.status === "fulfilled") {
        setReminders(remindersRes.value.data.reminders || []);
      }
      if (metrics.status === "fulfilled") {
        setSummary(metrics.value.summary);
      }
    } catch (e: any) {
      console.log("[MEU DIA ERROR]", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const doneCount = useMemo(() => reminders.filter(isReminderDone).length, [reminders]);
  const totalToday = reminders.length;
  const overdueList = useMemo(() => reminders.filter(isReminderOverdue), [reminders]);
  const overdueCount = overdueList.length;
  const nextReminder = useMemo(() => getNextReminder(reminders), [reminders]);
  const completionRate = totalToday > 0 ? doneCount / totalToday : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completionRate,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [completionRate]);

  async function registerAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED") {
    try {
      await api.post(`/reminders/${reminderId}/log`, {
        action,
        note: action === "DONE" ? "Feito via Meu Dia." : action === "SNOOZED" ? "Adiado via Meu Dia." : "Pulado via Meu Dia."
      });
      await loadData(true);

      if (action === "SNOOZED") {
        const reminder = reminders.find((r) => r.id === reminderId);
        if (reminder) showReplanDialog(reminder);
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.message || "Não foi possível atualizar.");
    }
  }

  function showReplanDialog(reminder: Reminder) {
    Alert.alert(
      "Atividade adiada",
      `"${reminder.title}" foi adiada. Deseja replanejar com a IA?`,
      [
        { text: "Não, obrigado", style: "cancel" },
        {
          text: "Replanejar com IA",
          onPress: () => handleReplan(reminder)
        }
      ]
    );
  }

  async function handleReplan(reminder: Reminder) {
    try {
      setIsReplanning(true);
      const response = await api.post("/ai/reschedule", {
        reminderId: reminder.id,
        title: reminder.title,
        originalTime: reminder.startAt
      });
      const suggestion = response.data.suggestion;
      Alert.alert(
        "Sugestão da IA",
        `Reagendar "${reminder.title}" para ${suggestion.suggestedTime}?\n\nMotivo: ${suggestion.reason}`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              await api.post("/ai/reschedule/confirm", {
                reminderId: reminder.id,
                newTime: suggestion.suggestedTimeIso
              });
              loadData(true);
            }
          }
        ]
      );
    } catch (e: any) {
      Alert.alert("Sugestão", "Tente reagendar manualmente em Cronogramas.");
    } finally {
      setIsReplanning(false);
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  const firstName = user?.name?.split(" ")[0] || "você";

  return (
    <ScreenLayout scroll={true}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title="Meu Dia"
            subtitle={formatLongDate()}
            onMenu={isWide ? undefined : openMenu}
          />

          {/* Saudação personalizada */}
          <View style={[styles.greetCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.greetLeft}>
              <Text style={[styles.greetText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.greetName, { color: theme.text, fontSize: scaledFont(22, width) }]}>
                {firstName}!
              </Text>
              <Text style={[styles.greetSub, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                {totalToday === 0
                  ? "Nenhuma atividade hoje."
                  : overdueCount > 0
                  ? `Você tem ${totalToday} ${totalToday === 1 ? "atividade" : "atividades"} hoje, ${overdueCount} atrasada${overdueCount > 1 ? "s" : ""}.`
                  : nextReminder
                  ? `Você tem ${totalToday} ${totalToday === 1 ? "atividade" : "atividades"} hoje. A próxima é ${nextReminder.title} às ${formatTime(nextReminder.startAt)}.`
                  : `Você concluiu ${doneCount} de ${totalToday} ${totalToday === 1 ? "atividade" : "atividades"} hoje.`}
              </Text>
            </View>
            <View style={[styles.greetOrb, { backgroundColor: theme.primarySoft }]}>
              <IconSymbol name="brain" size={28} color={theme.primary} />
            </View>
          </View>

          {/* Progresso do dia */}
          <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>
                Progresso do dia
              </Text>
              <Text style={[styles.progressPercent, { color: theme.primary, fontSize: scaledFont(14, width) }]}>
                {Math.round(completionRate * 100)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: completionRate === 1 ? colors.success : theme.primary, width: progressWidth }
                ]}
              />
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatNum, { color: colors.success, fontSize: scaledFont(18, width) }]}>
                  {doneCount}
                </Text>
                <Text style={[styles.progressStatLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                  Feitas
                </Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatNum, { color: theme.primary, fontSize: scaledFont(18, width) }]}>
                  {totalToday - doneCount}
                </Text>
                <Text style={[styles.progressStatLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                  Pendentes
                </Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatNum, { color: colors.danger, fontSize: scaledFont(18, width) }]}>
                  {overdueCount}
                </Text>
                <Text style={[styles.progressStatLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                  Atrasadas
                </Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatNum, { color: colors.warning, fontSize: scaledFont(18, width) }]}>
                  {summary?.streakDays || 0}
                </Text>
                <Text style={[styles.progressStatLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                  Sequência
                </Text>
              </View>
            </View>
          </View>

          {/* Botões de ação principais */}
          <View style={[styles.actionRow, { gap: spacing.sm }]}>
            <Pressable
              style={[styles.actionBtn, styles.actionBtnPrimary, { flex: 1 }]}
              onPress={() =>
                router.push({
                  pathname: "/ai-prompt",
                  params: {
                    prefillPrompt: buildDayReorganizePrompt(reminders)
                  }
                })
              }
            >
              <IconSymbol name="auto-fix" size={18} color={colors.white} />
              <Text style={[styles.actionBtnText, { fontSize: scaledFont(13, width) }]}>
                Reorganizar com IA
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, flex: 1 }
              ]}
              onPress={() => {
                if (!nextReminder) {
                  Alert.alert("Modo Foco", "Não há atividades pendentes para iniciar o foco.");
                  return;
                }
                router.push({
                  pathname: "/foco",
                  params: {
                    reminderId: nextReminder.id,
                    title: nextReminder.title,
                    description: nextReminder.description || ""
                  }
                });
              }}
            >
              <IconSymbol name="timer-outline" size={18} color={theme.primary} />
              <Text style={[styles.actionBtnText, { color: theme.text, fontSize: scaledFont(13, width) }]}>
                Começar foco
              </Text>
            </Pressable>
          </View>

          {/* Próxima atividade */}
          {nextReminder && (
            <View style={[styles.section]}>
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                Agora
              </Text>
              <View style={[styles.nextCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                <View style={styles.nextCardLeft}>
                  <View style={[styles.nextDot, { backgroundColor: theme.primary }]} />
                  <View>
                    <Text style={[styles.nextTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                      {nextReminder.title}
                    </Text>
                    {nextReminder.description ? (
                      <Text style={[styles.nextDesc, { color: theme.textMuted, fontSize: scaledFont(13, width) }]} numberOfLines={1}>
                        {nextReminder.description}
                      </Text>
                    ) : null}
                    <View style={styles.nextMeta}>
                      <IconSymbol name="clock-outline" size={13} color={theme.textSoft} />
                      <Text style={[styles.nextMetaText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                        {formatTime(nextReminder.startAt)}
                      </Text>
                      {nextReminder.schedule?.title ? (
                        <>
                          <IconSymbol name="format-list-checks" size={13} color={theme.textSoft} />
                          <Text style={[styles.nextMetaText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]} numberOfLines={1}>
                            {nextReminder.schedule.title}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
                <Pressable
                  style={[styles.nextFocusBtn, { backgroundColor: theme.primarySoft }]}
                  onPress={() =>
                    router.push({
                      pathname: "/foco",
                      params: {
                        reminderId: nextReminder.id,
                        title: nextReminder.title,
                        description: nextReminder.description || ""
                      }
                    })
                  }
                >
                  <IconSymbol name="play" size={18} color={theme.primary} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Atividades atrasadas */}
          {overdueList.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.danger, fontSize: scaledFont(16, width) }]}>
                  Atrasadas
                </Text>
                <View style={[styles.sectionBadge, { backgroundColor: colors.dangerSoft }]}>
                  <Text style={[styles.sectionBadgeText, { color: colors.danger, fontSize: scaledFont(11, width) }]}>
                    {overdueList.length}
                  </Text>
                </View>
              </View>
              {overdueList.slice(0, 3).map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onDone={() => registerAction(r.id, "DONE")}
                  onSnooze={() => registerAction(r.id, "SNOOZED")}
                  onSkip={() => registerAction(r.id, "SKIPPED")}
                />
              ))}
              {overdueList.length > 3 && (
                <Pressable
                  style={[styles.seeMoreBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => router.push("/home")}
                >
                  <Text style={[styles.seeMoreText, { color: theme.primary, fontSize: scaledFont(13, width) }]}>
                    Ver todas as {overdueList.length} atrasadas
                  </Text>
                  <IconSymbol name="chevron-right" size={16} color={theme.primary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Sugestão da IA */}
          {summary?.aiAdoptionRate !== undefined && (
            <View style={[styles.aiSuggestion, { backgroundColor: isDark ? "#111A2E" : "#EEF2FF", borderColor: isDark ? "#2D3F66" : "#C7D2FE" }]}>
              <View style={styles.aiSuggestionLeft}>
                <IconSymbol name="brain" size={20} color="#4F46E5" />
              </View>
              <View style={styles.aiSuggestionBody}>
                <Text style={[styles.aiSuggestionTitle, { fontSize: scaledFont(13, width) }]}>
                  Sugestão da IA
                </Text>
                <Text style={[styles.aiSuggestionText, { fontSize: scaledFont(12, width) }]}>
                  {completionRate >= 0.8
                    ? "Excelente ritmo! Você está no caminho certo. Continue assim."
                    : overdueCount > 0
                    ? `Você tem ${overdueCount} atividade${overdueCount > 1 ? "s" : ""} atrasada${overdueCount > 1 ? "s" : ""}. Use o botão "Reorganizar com IA" para redistribuir seu dia.`
                    : "Tente iniciar o próximo item em blocos de 25 minutos para manter o foco."}
                </Text>
              </View>
            </View>
          )}

          {/* Todas as atividades de hoje */}
          {isLoading ? (
            <LoadingState message="Carregando seu dia..." />
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                  Todas de hoje
                </Text>
                <Pressable onPress={() => router.push("/home")}>
                  <Text style={[styles.seeAllText, { color: theme.primary, fontSize: scaledFont(12, width) }]}>
                    Ver lista completa
                  </Text>
                </Pressable>
              </View>
              {reminders.slice(0, 5).map((r) => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onDone={() => registerAction(r.id, "DONE")}
                  onSnooze={() => registerAction(r.id, "SNOOZED")}
                  onSkip={() => registerAction(r.id, "SKIPPED")}
                />
              ))}
              {reminders.length === 0 && !isLoading && (
                <Pressable
                  style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => router.push("/ai-prompt")}
                >
                  <IconSymbol name="calendar-blank-outline" size={32} color={theme.textSoft} />
                  <Text style={[styles.emptyTitle, { color: theme.text, fontSize: scaledFont(15, width) }]}>
                    Nenhuma atividade hoje
                  </Text>
                  <Text style={[styles.emptyText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                    Crie uma rotina com IA ou adicione manualmente.
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", minWidth: 0 },

  greetCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft
  },
  greetLeft: { flex: 1 },
  greetText: { fontFamily: fonts.medium },
  greetName: { fontFamily: fonts.title, marginTop: 2 },
  greetSub: { fontFamily: fonts.regular, marginTop: spacing.xs, lineHeight: 19 },
  greetOrb: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md
  },

  progressCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm
  },
  progressTitle: { fontFamily: fonts.bold },
  progressPercent: { fontFamily: fonts.title },
  progressBar: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginBottom: spacing.md
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  progressStat: { alignItems: "center" },
  progressStatNum: { fontFamily: fonts.title },
  progressStatLabel: { fontFamily: fonts.medium, marginTop: 2 },

  actionRow: {
    flexDirection: "row",
    marginBottom: spacing.lg
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary
  },
  actionBtnText: {
    fontFamily: fonts.bold,
    color: colors.white
  },

  section: { marginBottom: spacing.lg },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  sectionTitle: { fontFamily: fonts.title },
  sectionBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  sectionBadgeText: { fontFamily: fonts.bold },

  nextCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow.soft
  },
  nextCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  nextDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5
  },
  nextTitle: { fontFamily: fonts.title },
  nextDesc: { fontFamily: fonts.regular, marginTop: 2 },
  nextMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: "wrap"
  },
  nextMetaText: { fontFamily: fonts.medium },
  nextFocusBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },

  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm
  },
  seeMoreText: { fontFamily: fonts.bold },
  seeAllText: { fontFamily: fonts.bold },

  aiSuggestion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  aiSuggestionLeft: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(79,70,229,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  aiSuggestionBody: { flex: 1 },
  aiSuggestionTitle: {
    fontFamily: fonts.bold,
    color: "#4F46E5",
    marginBottom: spacing.xs
  },
  aiSuggestionText: {
    fontFamily: fonts.regular,
    color: "#4F46E5",
    lineHeight: 18
  },

  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.soft
  },
  emptyTitle: { fontFamily: fonts.title },
  emptyText: { fontFamily: fonts.regular, textAlign: "center" }
});
