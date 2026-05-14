import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getDashboardMetricsRequest } from "../src/services/metrics";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { PageHeader } from "../src/components/PageHeader";
import { IconSymbol } from "../src/components/IconSymbol";
import { LoadingState } from "../src/components/LoadingState";
import { DashboardMetrics } from "../src/types/api";

function getWeekLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function getBestDay(weekly: DashboardMetrics["weekly"]): string {
  if (!weekly.length) return "—";
  const best = [...weekly].sort((a, b) => b.completionRate - a.completionRate)[0];
  return best.label;
}

function getAchievementTone(rate: number): { color: string; label: string; icon: string } {
  if (rate >= 80) return { color: colors.success, label: "Excelente semana!", icon: "trophy-outline" };
  if (rate >= 50) return { color: colors.warning, label: "Boa evolução!", icon: "trending-up" };
  return { color: colors.danger, label: "Semana com desafios", icon: "alert-circle-outline" };
}

function buildWeeklyPlanPrompt(
  metrics: DashboardMetrics | null,
  weekRate: number,
  bestDay: string,
  bestCategory: string | null
) {
  const completion = Math.round(weekRate);

  if (!metrics) {
    return "Planeje minha proxima semana com uma rotina simples, realista e com lembretes diarios equilibrados.";
  }

  return [
    "Replaneje minha proxima semana com base no desempenho desta semana.",
    `Taxa media de conclusao: ${completion}%.`,
    `Melhor dia: ${bestDay || "sem dados"}.`,
    `Melhor categoria: ${bestCategory || "sem dados"}.`,
    `Pendentes: ${metrics.summary.pendingReminders}. Atrasadas: ${metrics.summary.overdueReminders || 0}. Adiadas: ${metrics.summary.snoozedReminders}.`,
    "Crie um cronograma realista, com blocos menores, pausas e prioridade para o que ficou pendente."
  ].join("\n");
}

export default function WeeklyReviewScreen() {
  const { theme, isDark } = useThemeMode();
  const { width } = useResponsive();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardMetricsRequest();
      setMetrics(data);
    } catch (e) {
      console.log("[WEEKLY REVIEW ERROR]", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const weekRate = metrics
    ? metrics.weekly.reduce((sum, d) => sum + d.completionRate, 0) / Math.max(metrics.weekly.length, 1)
    : 0;

  const achievement = getAchievementTone(weekRate);
  const bestDay = metrics ? getBestDay(metrics.weekly) : "—";
  const bestCategory = metrics?.summary.bestCategory || "—";

  return (
    <ScreenLayout scroll={true}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title="Revisão Semanal"
            subtitle={getWeekLabel()}
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.back()}
              >
                <IconSymbol name="arrow-left" size={16} color={theme.text} />
              </Pressable>
            }
          />

          {isLoading ? (
            <LoadingState message="Analisando sua semana..." />
          ) : (
            <>
              {/* Hero da semana */}
              <View style={[
                styles.heroBanner,
                { backgroundColor: `${achievement.color}12`, borderColor: `${achievement.color}30` }
              ]}>
                <View style={[styles.heroIconBox, { backgroundColor: `${achievement.color}20` }]}>
                  <IconSymbol name={achievement.icon as any} size={28} color={achievement.color} />
                </View>
                <View style={styles.heroBody}>
                  <Text style={[styles.heroTitle, { color: achievement.color, fontSize: scaledFont(18, width) }]}>
                    {achievement.label}
                  </Text>
                  <Text style={[styles.heroRate, { color: theme.text, fontSize: scaledFont(32, width) }]}>
                    {Math.round(weekRate)}%
                  </Text>
                  <Text style={[styles.heroDesc, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                    de conclusão esta semana
                  </Text>
                </View>
              </View>

              {/* Destaques */}
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                Destaques da semana
              </Text>

              <View style={[styles.highlightsGrid, { gap: spacing.sm }]}>
                {[
                  {
                    label: "Melhor dia",
                    value: bestDay,
                    icon: "star-outline",
                    color: colors.warning,
                    bg: colors.warningSoft
                  },
                  {
                    label: "Melhor categoria",
                    value: bestCategory,
                    icon: "medal-outline",
                    color: colors.accent,
                    bg: colors.accentSoft
                  },
                  {
                    label: "Sequência",
                    value: `${metrics?.summary.streakDays || 0} dias`,
                    icon: "fire",
                    color: colors.danger,
                    bg: colors.dangerSoft
                  },
                  {
                    label: "IA usada",
                    value: `${metrics?.summary.aiSchedules || 0} vez`,
                    icon: "auto-fix",
                    color: colors.primary,
                    bg: colors.primarySoft
                  }
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[
                      styles.highlightCard,
                      { backgroundColor: theme.surface, borderColor: theme.border }
                    ]}
                  >
                    <View style={[styles.highlightIcon, { backgroundColor: item.bg }]}>
                      <IconSymbol name={item.icon as any} size={18} color={item.color} />
                    </View>
                    <Text style={[styles.highlightValue, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                      {item.value}
                    </Text>
                    <Text style={[styles.highlightLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gráfico semanal */}
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(16, width), marginTop: spacing.lg }]}>
                Conclusões por dia
              </Text>

              <View style={[styles.barChart, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {(metrics?.weekly || []).map((day) => {
                  const barH = Math.max(day.completionRate, 4);
                  const barColor = day.completionRate >= 80
                    ? colors.success
                    : day.completionRate >= 50
                    ? colors.warning
                    : day.completionRate > 0
                    ? colors.danger
                    : theme.border;
                  return (
                    <View key={day.date} style={styles.barCol}>
                      <Text style={[styles.barPct, { color: theme.textMuted, fontSize: scaledFont(10, width) }]}>
                        {day.completionRate > 0 ? `${Math.round(day.completionRate)}%` : ""}
                      </Text>
                      <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                        <View style={[styles.barFill, { height: barH, backgroundColor: barColor }]} />
                      </View>
                      <Text style={[styles.barLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Insights da IA */}
              {metrics?.insights && metrics.insights.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(16, width), marginTop: spacing.lg }]}>
                    Análise da IA
                  </Text>
                  {metrics.insights.map((insight, i) => (
                    <View
                      key={i}
                      style={[
                        styles.insightCard,
                        { backgroundColor: isDark ? "#111A2E" : "#EEF2FF", borderColor: isDark ? "#2D3F66" : "#C7D2FE" }
                      ]}
                    >
                      <IconSymbol name="brain" size={16} color="#4F46E5" />
                      <Text style={[styles.insightText, { fontSize: scaledFont(13, width) }]}>
                        {insight}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {/* Sugestão de melhoria */}
              <View style={[styles.suggestionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.suggestionHeader}>
                  <IconSymbol name="lightbulb-on-outline" size={20} color={colors.warning} />
                  <Text style={[styles.suggestionTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>
                    Sugestão para a próxima semana
                  </Text>
                </View>
                <Text style={[styles.suggestionText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                  {weekRate >= 80
                    ? "Você está indo muito bem! Para evoluir, tente adicionar um novo hábito a partir de segunda-feira."
                    : weekRate >= 50
                    ? "Você completou mais da metade! Tente reduzir blocos de 2h para 45min — é mais fácil de manter o foco."
                    : "Comece pequeno: adicione apenas 2 ou 3 atividades por dia e aumente gradualmente ao longo das semanas."}
                </Text>
                <Pressable
                  style={[styles.suggestionBtn, { backgroundColor: theme.primarySoft }]}
                  onPress={() =>
                    router.push({
                      pathname: "/ai-prompt",
                      params: {
                        prefillPrompt: buildWeeklyPlanPrompt(metrics, weekRate, bestDay, bestCategory)
                      }
                    })
                  }
                >
                  <IconSymbol name="auto-fix" size={14} color={theme.primary} />
                  <Text style={[styles.suggestionBtnText, { color: theme.primary, fontSize: scaledFont(13, width) }]}>
                    Replanejar próxima semana com IA
                  </Text>
                </Pressable>
              </View>

              {/* Resumo numérico */}
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(16, width), marginTop: spacing.lg }]}>
                Resumo da semana
              </Text>
              <View style={[styles.summaryGrid, { gap: spacing.sm }]}>
                {[
                  { label: "Concluídas", value: metrics?.summary.doneReminders || 0, color: colors.success },
                  { label: "Puladas", value: metrics?.summary.skippedReminders || 0, color: colors.warning },
                  { label: "Perdidas", value: metrics?.summary.missedReminders || 0, color: colors.danger },
                  { label: "Adiadas", value: metrics?.summary.snoozedReminders || 0, color: "#06B6D4" }
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Text style={[styles.summaryNum, { color: item.color, fontSize: scaledFont(24, width) }]}>
                      {item.value}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%" },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },

  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  heroBody: { flex: 1 },
  heroTitle: { fontFamily: fonts.bold },
  heroRate: { fontFamily: fonts.title },
  heroDesc: { fontFamily: fonts.regular, marginTop: 2 },

  sectionTitle: { fontFamily: fonts.title, marginBottom: spacing.md },

  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md
  },
  highlightCard: {
    flexGrow: 1,
    flexBasis: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
    ...shadow.soft
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  highlightValue: { fontFamily: fonts.title },
  highlightLabel: { fontFamily: fonts.medium, textAlign: "center" },

  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    height: 160,
    marginBottom: spacing.md,
    ...shadow.soft
  },
  barCol: { alignItems: "center", flex: 1, gap: spacing.xs },
  barPct: { fontFamily: fonts.bold, height: 16, textAlignVertical: "center" },
  barTrack: { width: 20, height: 80, borderRadius: radius.pill, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: radius.pill, minHeight: 4 },
  barLabel: { fontFamily: fonts.bold },

  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  insightText: { fontFamily: fonts.regular, color: "#4F46E5", flex: 1, lineHeight: 19 },

  suggestionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadow.soft
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  suggestionTitle: { fontFamily: fonts.bold },
  suggestionText: { fontFamily: fonts.regular, lineHeight: 20, marginBottom: spacing.md },
  suggestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignSelf: "flex-start"
  },
  suggestionBtnText: { fontFamily: fonts.bold },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.xl
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
    ...shadow.soft
  },
  summaryNum: { fontFamily: fonts.title },
  summaryLabel: { fontFamily: fonts.medium }
});
