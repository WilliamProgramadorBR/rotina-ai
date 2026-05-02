import { useCallback, useEffect, useMemo, useState } from "react";

import { router, useFocusEffect } from "expo-router";
import { api } from "../src/services/api";
import { useAuth } from "../src/context/AuthContext";
import { colors, fonts, radius, shadow, spacing } from "../src/theme";
import { formatLongDate, getPeriodFromDate } from "../src/utils/date";
import { Button, EmptyState, LoadingState, StatCard } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { ReminderCard } from "../src/components/ReminderCard";
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
  logs?: Array<{ action: string }>;
};

const periods = ["Madrugada", "Manhã", "Tarde", "Noite"];

function reminderHasAction(reminder: Reminder, action: string) {
  return reminder.logs?.some((log) => log.action === action);
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "DONE">("ALL");

  const { width } = useWindowDimensions();

const isPhone = width <= 680;
const isCompact = width <= 1024;

  const loadTodayReminders = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get("/reminders/today");
      setReminders(response.data.reminders || []);
    } catch (error: any) {
      console.log("[HOME ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível carregar os lembretes.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTodayReminders(); }, [loadTodayReminders]));
  useEffect(() => { loadTodayReminders(); }, [loadTodayReminders]);

  const filteredReminders = useMemo(() => {
    if (activeFilter === "DONE") return reminders.filter((reminder) => reminderHasAction(reminder, "DONE"));
    if (activeFilter === "PENDING") {
      return reminders.filter((reminder) => !reminderHasAction(reminder, "DONE") && !reminderHasAction(reminder, "SKIPPED"));
    }
    return reminders;
  }, [activeFilter, reminders]);

  const grouped = useMemo(() => {
    return periods
      .map((period) => ({ period, data: filteredReminders.filter((reminder) => getPeriodFromDate(reminder.startAt) === period) }))
      .filter((group) => group.data.length > 0);
  }, [filteredReminders]);

  const doneCount = reminders.filter((reminder) => reminderHasAction(reminder, "DONE")).length;
  const pendingCount = reminders.filter((reminder) => !reminderHasAction(reminder, "DONE") && !reminderHasAction(reminder, "SKIPPED")).length;

  async function registerAction(reminderId: string, action: "DONE" | "SNOOZED" | "SKIPPED") {
    try {
      await api.post(`/reminders/${reminderId}/log`, {
        action,
        note: action === "DONE" ? "Marcado como feito pelo app." : action === "SNOOZED" ? "Adiado pelo app." : "Pulado pelo app."
      });
      await loadTodayReminders(true);
    } catch (error: any) {
      console.log("[REMINDER ACTION ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível atualizar o lembrete.");
    }
  }

  return (
  <ScreenLayout scroll={true}>
    {({ openMenu, isWide }) => (
      <View style={styles.page}>
        <PageHeader
          title={`Olá, ${user?.name?.split(" ")[0] || "Will"}!`}
          subtitle={formatLongDate()}
          onMenu={isWide ? undefined : openMenu}
          right={
            <Pressable
              style={styles.notificationButton}
              onPress={() => router.push("/settings")}
            >
              <Text style={styles.notificationText}>◔</Text>

              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>3</Text>
              </View>
            </Pressable>
          }
        />

        <View style={[styles.hero, isPhone && styles.heroPhone]}>
          <View style={[styles.aiOrb, isPhone && styles.aiOrbPhone]}>
            <Text style={styles.aiOrbText}>AI</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>ASSISTENTE DE ROTINA AI</Text>
            <Text style={[styles.heroTitle, isPhone && styles.heroTitlePhone]}>
              Sua rotina em modo inteligente.
            </Text>
            <Text style={styles.heroText}>
              Acompanhe seus lembretes, marque o que foi feito e deixe a IA te
              ajudar a manter o foco.
            </Text>
          </View>

          {!isPhone ? (
            <View style={styles.heroGhost}>
              <Text style={styles.heroGhostText}>✦</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <StatCard
              title="Hoje"
              value={reminders.length}
              icon="□"
              caption="Compromissos"
            />
          </View>

          <View style={styles.statItem}>
            <StatCard
              title="Pendentes"
              value={pendingCount}
              icon="⌛"
              tone="orange"
              caption="Aguardando"
            />
          </View>

          <View style={styles.statItem}>
            <StatCard
              title="Feitos"
              value={doneCount}
              icon="✓"
              tone="green"
              caption="Concluídos"
            />
          </View>

          <View style={styles.statItem}>
            <StatCard
              title="Sequência"
              value="7"
              icon="✦"
              tone="violet"
              caption="dias"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Ações rápidas</Text>

        <View style={styles.quickGrid}>
          <Pressable
            style={[styles.quickCard, styles.quickCardPrimary]}
            onPress={() => router.push("/ai-prompt")}
          >
            <Text style={styles.quickIconPrimary}>✦</Text>

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitlePrimary}>Criar com IA</Text>
              <Text style={styles.quickSubtitlePrimary}>
                Transforme texto em cronograma
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push("/schedules/new")}
          >
            <Text style={styles.quickIcon}>＋</Text>

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>Novo cronograma</Text>
              <Text style={styles.quickSubtitle}>Criar manualmente</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push("/schedules")}
          >
            <Text style={styles.quickIcon}>□</Text>

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>Ver cronogramas</Text>
              <Text style={styles.quickSubtitle}>Gerenciar rotinas</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.quickIcon}>◔</Text>

            <View style={styles.quickTextBox}>
              <Text style={styles.quickTitle}>Testar alarme</Text>
              <Text style={styles.quickSubtitle}>Enviar teste agora</Text>
            </View>
          </Pressable>
        </View>

        <View style={[styles.todayHeader, isPhone && styles.todayHeaderPhone]}>
          <View style={styles.todayTitleRow}>
            <Text style={styles.todayTitle}>Hoje</Text>

            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{reminders.length} itens</Text>
            </View>
          </View>

          <View style={styles.filters}>
            {[
              { key: "ALL", label: "Todos" },
              { key: "PENDING", label: "Pendentes" },
              { key: "DONE", label: "Feitos" }
            ].map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.filter,
                  activeFilter === item.key && styles.filterActive
                ]}
                onPress={() => setActiveFilter(item.key as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === item.key && styles.filterTextActive
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <LoadingState label="Organizando seus lembretes..." />
        ) : (
          <View style={styles.timeline}>
            {grouped.length === 0 ? (
              <EmptyState
                icon="🌤️"
                title="Nada por aqui"
                description="Você ainda não possui lembretes para este filtro. Crie um cronograma manual ou gere uma rotina com IA."
                action={
                  <Button
                    title="Criar com IA"
                    onPress={() => router.push("/ai-prompt")}
                  />
                }
              />
            ) : (
              grouped.map((group) => (
                <View key={group.period} style={styles.periodBlock}>
                  <View style={styles.periodHeader}>
                    <Text style={styles.periodTitle}>{group.period}</Text>
                    <Text style={styles.periodCount}>
                      {group.data.length}{" "}
                      {group.data.length === 1 ? "alarme" : "alarmes"}
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },

  notificationText: {
    color: colors.text,
    fontSize: 18
  },

  notificationDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
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
    minHeight: 164,
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    overflow: "hidden",
    ...shadow.soft
  },

  heroPhone: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: spacing.lg,
    borderRadius: 26,
    gap: spacing.md
  },

  heroContent: {
    flex: 1,
    minWidth: 0
  },

  aiOrb: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    alignItems: "center",
    justifyContent: "center"
  },

  aiOrbPhone: {
    width: 64,
    height: 64,
    borderRadius: 32
  },

  aiOrbText: {
    color: colors.accent,
    fontFamily: fonts.title,
    fontSize: 24
  },

  heroGhost: {
    width: 150,
    height: 120,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8
  },

  heroGhostText: {
    color: colors.primary,
    fontSize: 54
  },

  heroKicker: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1
  },

  heroTitle: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 24,
    lineHeight: 31,
    marginTop: spacing.sm
  },

  heroTitlePhone: {
    fontSize: 22,
    lineHeight: 28
  },

  heroText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 560
  },

  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.lg
  },

  statItem: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 145
  },

  sectionLabel: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 15,
    marginBottom: spacing.md
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl
  },

  quickCard: {
    flexGrow: 1,
    flexBasis: 230,
    minWidth: 0,
    minHeight: 84,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow.soft
  },

  quickCardPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },

  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    textAlign: "center",
    textAlignVertical: "center",
    color: colors.primary,
    fontSize: 24
  },

  quickIconPrimary: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    textAlign: "center",
    textAlignVertical: "center",
    color: colors.white,
    fontSize: 24
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
    color: "#DCE8FF",
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

  todayHeaderPhone: {
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
    fontFamily: fonts.title,
    fontSize: 24
  },

  todayBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },

  todayBadgeText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },

  filter: {
    height: 38,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },

  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },

  filterText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 13
  },

  filterTextActive: {
    color: colors.white
  },

  timeline: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl
  },

  periodBlock: {
    marginBottom: spacing.xl
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
    fontSize: 18,
    fontFamily: fonts.title
  },

  periodCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.bold
  }
});
