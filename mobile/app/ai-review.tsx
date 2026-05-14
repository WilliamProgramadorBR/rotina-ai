import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../src/services/api";
import { ScheduleSuggestion } from "../src/types/entities";
import { colors, getCategoryMeta, spacing } from "../src/theme";
import { Button, Card, EmptyState, StatCard } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { scheduleLocalNotificationsForReminders } from "../src/services/aiNotifications";
import { scheduleReminderAlarm } from "@/services/alarmNotifications";
import { useThemeMode } from "../src/context/ThemeContext";
import { IconSymbol } from "../src/components/IconSymbol";

export default function AiReviewScreen() {
  const { theme, isDark } = useThemeMode();
  const { suggestion: suggestionParam } = useLocalSearchParams<{ suggestion?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestion = useMemo<ScheduleSuggestion | null>(() => {
    try {
      if (!suggestionParam) return null;
      return JSON.parse(suggestionParam);
    } catch {
      return null;
    }
  }, [suggestionParam]);

  async function handleConfirm() {
    if (!suggestion) return;

    try {
      setIsSubmitting(true);
      const response = await api.post("/ai/schedules/confirm", {
  suggestion
});

const createdSchedule = response.data.schedule;

for (const reminder of createdSchedule.reminders || []) {
  await scheduleReminderAlarm({
    reminderId: reminder.id,
    title: reminder.title,
    description: reminder.description,
    startAt: reminder.startAt,
    scheduleTitle: createdSchedule.title
  });
}
      const reminders = response.data.reminders || response.data.schedule?.reminders || [];
      await scheduleLocalNotificationsForReminders(reminders);
      Alert.alert("Cronograma criado", "Os lembretes foram criados e as notificações foram agendadas.");
      router.replace("/home");
    } catch (error: any) {
      console.log("[AI CONFIRM ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível criar o cronograma.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!suggestion) {
    return (
      <ScreenLayout>
        {({ openMenu, isWide }) => (
          <>
            <PageHeader title="Revisão IA" subtitle="Sugestão não encontrada" onMenu={isWide ? undefined : openMenu} />
            <EmptyState icon="⚠️" title="Não foi possível carregar a sugestão" description="Volte e gere o cronograma novamente." action={<Button title="Voltar" onPress={() => router.replace("/ai-prompt")} />} />
          </>
        )}
      </ScreenLayout>
    );
  }

  const meta = getCategoryMeta(suggestion.category);

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader
            title="Revisar IA"
            subtitle="Confira antes de salvar"
            onMenu={isWide ? undefined : openMenu}
            right={<Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.backText, { color: theme.text }]}>Editar</Text></Pressable>}
          />

          <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: meta.background }]}><IconSymbol name={meta.iconName} size={28} color={meta.color} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{suggestion.title}</Text>
              <Text style={[styles.category, { color: theme.textMuted }]}>{meta.label}</Text>
              {suggestion.description ? <Text style={[styles.description, { color: theme.textMuted }]}>{suggestion.description}</Text> : null}
            </View>
          </View>

          <View style={styles.stats}>
            <StatCard title="Alarmes" value={suggestion.reminders.length} icon="🔔" />
            <StatCard title="Confiança" value={`${Math.round((suggestion.confidence || 0.7) * 100)}%`} icon="🧠" tone="violet" />
          </View>

          {suggestion.warnings?.length ? (
            <Card style={styles.warningCard}>
              <Text style={styles.warningTitle}>Atenção antes de salvar</Text>
              {suggestion.warnings.map((warning, index) => (
                <Text key={`${warning}-${index}`} style={styles.warningText}>• {warning}</Text>
              ))}
            </Card>
          ) : null}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Alarmes sugeridos</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {suggestion.reminders.map((reminder, index) => (
              <View key={`${reminder.title}-${index}`} style={[styles.reminder, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.dateBox, { backgroundColor: isDark ? theme.surfaceMuted : theme.dark }]}>
                  <Text style={styles.date}>{reminder.date}</Text>
                  <Text style={styles.time}>{reminder.time}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reminderTitle, { color: theme.text }]}>{reminder.title}</Text>
                  {reminder.description ? <Text style={[styles.reminderDescription, { color: theme.textMuted }]}>{reminder.description}</Text> : null}
                </View>
              </View>
            ))}

            <View style={styles.bottomActions}>
              <Button title="Confirmar e criar alarmes" onPress={handleConfirm} loading={isSubmitting} />
              <Button title="Voltar para editar" variant="secondary" onPress={() => router.back()} />
            </View>
          </ScrollView>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontWeight: "900" },
  hero: { backgroundColor: colors.white, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, flexDirection: "row", gap: spacing.lg, marginBottom: spacing.lg },
  iconBox: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 30 },
  title: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: "900" },
  category: { color: colors.textMuted, fontWeight: "900", marginTop: spacing.xs },
  description: { color: colors.textMuted, lineHeight: 21, marginTop: spacing.sm },
  stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  warningCard: { backgroundColor: colors.warningSoft, borderColor: "#FDE68A", marginBottom: spacing.lg },
  warningTitle: { color: colors.text, fontSize: 16, fontWeight: "900", marginBottom: spacing.sm },
  warningText: { color: "#92400E", lineHeight: 21, fontWeight: "700", marginBottom: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900", marginBottom: spacing.md },
  reminder: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm },
  dateBox: { width: 92, borderRadius: 16, backgroundColor: colors.dark, padding: spacing.sm, alignItems: "center", justifyContent: "center" },
  date: { color: "#CBD5E1", fontSize: 11, fontWeight: "800" },
  time: { color: colors.white, fontSize: 18, fontWeight: "900", marginTop: spacing.xs },
  reminderTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  reminderDescription: { color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs },
  bottomActions: { gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xxxl }
});
