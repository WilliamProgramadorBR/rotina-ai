import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../src/services/api";
import { ScheduleSuggestion } from "../src/types/entities";
import { colors, fonts, getCategoryMeta, radius, spacing } from "../src/theme";
import { Button, Card, EmptyState } from "../src/components/ui";
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
      const response = await api.post("/ai/schedules/confirm", { suggestion });

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
            <EmptyState
              icon="⚠️"
              title="Não foi possível carregar a sugestão"
              description="Volte e gere o cronograma novamente."
              action={<Button title="Voltar" onPress={() => router.replace("/ai-prompt")} />}
            />
          </>
        )}
      </ScreenLayout>
    );
  }

  const meta = getCategoryMeta(suggestion.category);
  const confidence = Math.round((suggestion.confidence || 0.7) * 100);
  const reminderCount = suggestion.reminders.length;

  return (
    <ScreenLayout scroll={false}>
      {({ openMenu, isWide }) => (
        <View style={styles.container}>
          <PageHeader
            title="Revisar sugestão"
            subtitle="Confira antes de confirmar"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                onPress={() => router.back()}
                style={[styles.editButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.editButtonText, { color: theme.text }]}>✏️ Editar</Text>
              </Pressable>
            }
          />

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero do cronograma */}
            <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.heroIconBox, { backgroundColor: meta.background }]}>
                <IconSymbol name={meta.iconName} size={32} color={meta.color} />
              </View>
              <View style={styles.heroBody}>
                <View style={[styles.categoryChip, { backgroundColor: meta.background }]}>
                  <Text style={[styles.categoryChipText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={[styles.heroTitle, { color: theme.text }]} numberOfLines={2}>
                  {suggestion.title}
                </Text>
                {suggestion.description ? (
                  <Text style={[styles.heroDescription, { color: theme.textMuted }]}>
                    {suggestion.description}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.statEmoji}>🔔</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{reminderCount}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Alarmes</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.statEmoji}>🧠</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{confidence}%</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Confiança</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={styles.statEmoji}>✦</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>IA</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Gerado por</Text>
              </View>
            </View>

            {/* Warnings */}
            {suggestion.warnings?.length ? (
              <View style={[styles.warningBox, {
                backgroundColor: isDark ? "#2A1E08" : "#FFFBEB",
                borderColor: "#FDE68A"
              }]}>
                <View style={styles.warningHeader}>
                  <Text style={styles.warningEmoji}>⚠️</Text>
                  <Text style={[styles.warningTitle, { color: theme.text }]}>Atenção antes de salvar</Text>
                </View>
                {suggestion.warnings.map((warning, index) => (
                  <Text key={`${warning}-${index}`} style={[styles.warningItem, { color: isDark ? "#FCD34D" : "#92400E" }]}>
                    • {warning}
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Seção de alarmes */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Alarmes sugeridos</Text>
              <View style={[styles.countBadge, { backgroundColor: isDark ? theme.surfaceMuted : colors.primarySoft }]}>
                <Text style={[styles.countBadgeText, { color: theme.primary }]}>{reminderCount}</Text>
              </View>
            </View>

            {suggestion.reminders.map((reminder, index) => (
              <View
                key={`${reminder.title}-${index}`}
                style={[styles.reminderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                {/* Indicador numérico */}
                <View style={[styles.reminderIndex, { backgroundColor: isDark ? theme.surfaceMuted : colors.primarySoft }]}>
                  <Text style={[styles.reminderIndexText, { color: theme.primary }]}>{index + 1}</Text>
                </View>

                {/* Caixa de data/hora */}
                <View style={[styles.timeBox, { backgroundColor: isDark ? theme.surfaceMuted : colors.dark }]}>
                  <Text style={styles.timeText}>{reminder.time}</Text>
                  <Text style={styles.dateText}>{reminder.date}</Text>
                </View>

                {/* Conteúdo */}
                <View style={styles.reminderContent}>
                  <Text style={[styles.reminderTitle, { color: theme.text }]} numberOfLines={2}>
                    {reminder.title}
                  </Text>
                  {reminder.description ? (
                    <Text style={[styles.reminderDescription, { color: theme.textMuted }]} numberOfLines={3}>
                      {reminder.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Barra de confirmação fixa no rodapé */}
          <View style={[styles.stickyBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={styles.stickyInfo}>
              <Text style={[styles.stickyLabel, { color: theme.textMuted }]}>
                {reminderCount} alarme{reminderCount !== 1 ? "s" : ""} serão agendados
              </Text>
              <View style={[styles.confidencePill, { backgroundColor: isDark ? theme.surfaceMuted : colors.successSoft }]}>
                <Text style={[styles.confidencePillText, { color: isDark ? theme.success : colors.success }]}>
                  {confidence}% confiança
                </Text>
              </View>
            </View>
            <Button
              title="Confirmar e criar alarmes"
              onPress={handleConfirm}
              loading={isSubmitting}
              style={styles.confirmButton}
            />
            <Pressable onPress={() => router.back()} style={styles.editLink} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={[styles.editLinkText, { color: theme.textMuted }]}>← Voltar para editar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing.xl
  },

  // Edit button no header
  editButton: {
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  editButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14
  },

  // Hero
  hero: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-start",
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.lg
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  heroBody: {
    flex: 1,
    gap: spacing.xs
  },
  categoryChip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: spacing.xs
  },
  categoryChipText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  heroTitle: {
    fontFamily: fonts.title,
    fontSize: 20,
    lineHeight: 26
  },
  heroDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs
  },
  statEmoji: {
    fontSize: 20
  },
  statValue: {
    fontFamily: fonts.title,
    fontSize: 16
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11
  },

  // Warning
  warningBox: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  warningEmoji: {
    fontSize: 18
  },
  warningTitle: {
    fontFamily: fonts.bold,
    fontSize: 15
  },
  warningItem: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.xs
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: 18
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  countBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 13
  },

  // Reminder cards
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.sm
  },
  reminderIndex: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  reminderIndexText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  timeBox: {
    width: 80,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  timeText: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 17
  },
  dateText: {
    color: "#CBD5E1",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2
  },
  reminderContent: {
    flex: 1,
    gap: spacing.xs
  },
  reminderTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 21
  },
  reminderDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18
  },

  // Sticky bottom bar
  stickyBar: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm
  },
  stickyInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs
  },
  stickyLabel: {
    fontFamily: fonts.medium,
    fontSize: 13
  },
  confidencePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  confidencePillText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  confirmButton: {
    width: "100%"
  },
  editLink: {
    alignItems: "center",
    paddingVertical: spacing.xs
  },
  editLinkText: {
    fontFamily: fonts.medium,
    fontSize: 13
  }
});
