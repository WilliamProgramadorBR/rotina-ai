import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../src/services/api";
import { Reminder, Schedule } from "../../src/types/entities";
import { colors, getCategoryMeta, spacing } from "../../src/theme";
import { formatTime, getPeriodFromDate } from "../../src/utils/date";
import { Button, EmptyState, LoadingState, StatCard } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/schedules/${id}`);
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.log("[SCHEDULE DETAIL ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível carregar o cronograma.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadSchedule(); }, [loadSchedule]));

  const reminders = useMemo(() => schedule?.reminders || [], [schedule]);
  const meta = getCategoryMeta(schedule?.category);

  const grouped = useMemo(() => {
    const periods = ["Madrugada", "Manhã", "Tarde", "Noite"];
    return periods
      .map((period) => ({ period, data: reminders.filter((reminder) => getPeriodFromDate(reminder.startAt) === period) }))
      .filter((group) => group.data.length > 0);
  }, [reminders]);

  async function deleteSchedule() {
    if (!schedule) return;

    Alert.alert("Remover cronograma", "Essa ação remove o cronograma e seus lembretes. Deseja continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/schedules/${schedule.id}`);
            router.replace("/schedules");
          } catch (error: any) {
            Alert.alert("Erro", error?.response?.data?.message || "Não foi possível remover.");
          }
        }
      }
    ]);
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader title="Detalhes" subtitle="Cronograma e lembretes" onMenu={isWide ? undefined : openMenu} right={<Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></Pressable>} />

          {isLoading ? (
            <LoadingState label="Carregando cronograma..." />
          ) : !schedule ? (
            <EmptyState icon="📋" title="Cronograma não encontrado" description="Não foi possível localizar este cronograma." />
          ) : (
            <>
              <View style={styles.hero}>
                <View style={[styles.iconBox, { backgroundColor: meta.soft }]}><Text style={styles.icon}>{meta.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{schedule.title}</Text>
                  <Text style={styles.category}>{meta.label}</Text>
                  {schedule.description ? <Text style={styles.description}>{schedule.description}</Text> : null}
                </View>
              </View>

              <View style={styles.stats}>
                <StatCard title="Lembretes" value={reminders.length} icon="🔔" />
                <StatCard title="Categoria" value={meta.label} icon={meta.icon} tone="purple" />
              </View>

              <View style={styles.actionRow}>
                <Button title="Novo lembrete" onPress={() => router.push({ pathname: "/reminders/new", params: { scheduleId: schedule.id } })} style={{ flex: 1 }} />
                <Button title="Remover" variant="danger" onPress={deleteSchedule} style={{ flex: 1 }} />
              </View>

              <Text style={styles.sectionTitle}>Lembretes do cronograma</Text>

              {grouped.length === 0 ? (
                <EmptyState icon="🔔" title="Sem lembretes" description="Adicione o primeiro lembrete para ativar este cronograma." action={<Button title="Adicionar lembrete" onPress={() => router.push({ pathname: "/reminders/new", params: { scheduleId: schedule.id } })} />} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {grouped.map((group) => (
                    <View key={group.period} style={styles.period}>
                      <Text style={styles.periodTitle}>{group.period}</Text>
                      {group.data.map((reminder: Reminder) => (
                        <View key={reminder.id} style={styles.reminderRow}>
                          <Text style={styles.reminderTime}>{formatTime(reminder.startAt)}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            {reminder.description ? <Text style={styles.reminderDescription} numberOfLines={2}>{reminder.description}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontWeight: "900" },
  hero: { backgroundColor: colors.white, borderRadius: 28, padding: spacing.xl, flexDirection: "row", gap: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  iconBox: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 30 },
  title: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: "900" },
  category: { color: colors.textMuted, fontWeight: "900", marginTop: spacing.xs },
  description: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  actionRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900", marginBottom: spacing.md },
  period: { marginBottom: spacing.xl },
  periodTitle: { color: colors.textMuted, fontWeight: "900", marginBottom: spacing.sm },
  reminderRow: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, flexDirection: "row", gap: spacing.md, alignItems: "flex-start", marginBottom: spacing.sm },
  reminderTime: { color: colors.white, backgroundColor: colors.dark, borderRadius: 999, overflow: "hidden", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontWeight: "900" },
  reminderTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  reminderDescription: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 }
});
