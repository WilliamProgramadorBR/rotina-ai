import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../src/services/api";
import { useAuth } from "../src/context/AuthContext";
import { Reminder } from "../src/types/entities";
import { colors, spacing } from "../src/theme";
import { formatLongDate, getPeriodFromDate } from "../src/utils/date";
import { Button, EmptyState, LoadingState, StatCard } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { ReminderCard } from "../src/components/ReminderCard";

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
    <ScreenLayout scroll={false}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title={`Olá, ${user?.name?.split(" ")[0] || "usuário"}`}
            subtitle={formatLongDate()}
            onMenu={isWide ? undefined : openMenu}
            right={<Pressable style={styles.aiButton} onPress={() => router.push("/ai-prompt")}><Text style={styles.aiButtonText}>✨ IA</Text></Pressable>}
          />

          <View style={styles.hero}>
            <Text style={styles.heroKicker}>Painel do dia</Text>
            <Text style={styles.heroTitle}>Sua rotina em modo controle.</Text>
            <Text style={styles.heroText}>Acompanhe seus lembretes, marque o que foi feito e crie novos cronogramas com IA.</Text>
          </View>

          <View style={styles.stats}>
            <StatCard title="Hoje" value={reminders.length} icon="🔔" />
            <StatCard title="Pendentes" value={pendingCount} icon="⏳" tone="orange" />
            <StatCard title="Feitos" value={doneCount} icon="✅" tone="green" />
          </View>

          <View style={styles.quickActions}>
            <Button title="Cronogramas" variant="secondary" onPress={() => router.push("/schedules")} style={styles.quickButton} />
            <Button title="Criar com IA" onPress={() => router.push("/ai-prompt")} style={styles.quickButton} />
          </View>

          <View style={styles.filters}>
            {[
              { key: "ALL", label: "Todos" },
              { key: "PENDING", label: "Pendentes" },
              { key: "DONE", label: "Feitos" }
            ].map((item) => (
              <Pressable key={item.key} style={[styles.filter, activeFilter === item.key && styles.filterActive]} onPress={() => setActiveFilter(item.key as any)}>
                <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {isLoading ? (
            <LoadingState label="Organizando seus lembretes..." />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.timeline}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadTodayReminders(true); }} />}
            >
              {grouped.length === 0 ? (
                <EmptyState
                  icon="🌤️"
                  title="Nada por aqui"
                  description="Você ainda não possui lembretes para este filtro. Crie um cronograma manual ou gere uma rotina com IA."
                  action={<Button title="Criar com IA" onPress={() => router.push("/ai-prompt")} />}
                />
              ) : (
                grouped.map((group) => (
                  <View key={group.period} style={styles.periodBlock}>
                    <View style={styles.periodHeader}>
                      <Text style={styles.periodTitle}>{group.period}</Text>
                      <Text style={styles.periodCount}>{group.data.length} {group.data.length === 1 ? "alarme" : "alarmes"}</Text>
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
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hero: { backgroundColor: colors.dark, borderRadius: 28, padding: spacing.xl, marginBottom: spacing.lg },
  heroKicker: { color: "#93C5FD", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  heroTitle: { color: colors.white, fontWeight: "900", fontSize: 26, lineHeight: 32, marginTop: spacing.sm },
  heroText: { color: "#CBD5E1", fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  aiButton: { height: 44, minWidth: 72, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  aiButtonText: { color: colors.white, fontWeight: "900" },
  stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  quickActions: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  quickButton: { flex: 1 },
  filters: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  filter: { height: 40, borderRadius: 999, paddingHorizontal: spacing.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontWeight: "900" },
  filterTextActive: { color: colors.white },
  timeline: { paddingBottom: spacing.xxxl },
  periodBlock: { marginBottom: spacing.xl },
  periodHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  periodTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  periodCount: { color: colors.textMuted, fontSize: 12, fontWeight: "800" }
});
