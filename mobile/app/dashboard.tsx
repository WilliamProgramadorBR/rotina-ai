import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { DashboardMetrics } from "@/types/api";
import { getDashboardMetricsRequest } from "@/services/metrics";
import { Card, EmptyState, LoadingState, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { ScreenLayout } from "@/components/ScreenLayout";
import { colors, fonts, getCategoryMeta, radius, shadow, spacing, scaledFont } from "@/theme";
import { useResponsive } from "@/hooks/useResponsive";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function PercentBar({ value, color = colors.primary }: { value: number; color?: string }) {
  const percent = clampPercent(value);

  return (
    <View style={styles.percentTrack}>
      <View style={[styles.percentFill, { width: `${percent}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

function InsightCard({ text, index }: { text: string; index: number }) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightNumber}>
        <Text style={styles.insightNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { width, isPhone, isSmallPhone, gap } = useResponsive();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMobile = isPhone || isSmallPhone;

  const loadMetrics = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const nextMetrics = await getDashboardMetricsRequest();
      setMetrics(nextMetrics);
    } catch (error: any) {
      console.log("[DASHBOARD ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar as metricas.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMetrics(); }, [loadMetrics]));

  const maxWeeklyTotal = useMemo(() => {
    return Math.max(...(metrics?.weekly || []).map((item) => item.total), 1);
  }, [metrics]);
  const overdueReminders = metrics?.summary.overdueReminders ?? metrics?.summary.pendingReminders ?? 0;

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Dashboard"
            subtitle="Metricas reais da sua rotina"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.backButton, isSmallPhone && styles.backButtonSmall]}
                onPress={() => router.push("/home")}
              >
                <Text style={[styles.backText, { fontSize: scaledFont(13, width) }]}>Inicio</Text>
              </Pressable>
            }
          />

          {isLoading ? (
            <LoadingState label="Calculando seus indicadores..." />
          ) : !metrics ? (
            <EmptyState
              icon="D"
              title="Sem metricas"
              description="Nao foi possivel montar o dashboard agora."
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    loadMetrics(true);
                  }}
                />
              }
              contentContainerStyle={styles.scroll}
            >
              <View style={[styles.hero, isMobile && styles.heroMobile]}>
                <View style={[styles.heroIcon, isMobile && styles.heroIconMobile]}>
                  <Text style={[styles.heroIconText, { fontSize: scaledFont(isMobile ? 18 : 22, width) }]}>D</Text>
                </View>
                <View style={styles.heroCopy}>
                  <Text style={[styles.heroKicker, { fontSize: scaledFont(10, width) }]}>INTELIGENCIA DA ROTINA</Text>
                  <Text style={[styles.heroTitle, { fontSize: scaledFont(isMobile ? 20 : 26, width) }]}>
                    {overdueReminders} {overdueReminders === 1 ? "atividade atrasada" : "atividades atrasadas"} sem conclusao.
                  </Text>
                  <Text style={[styles.heroText, { fontSize: scaledFont(13, width) }]}>
                    Acompanhe desempenho, categorias fortes, pendencias e uso da IA com dados do backend.
                  </Text>
                </View>
              </View>

              <View style={[styles.stats, { gap }]}>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Conclusao" value={`${metrics.summary.completionRate}%`} icon="%" tone="green" caption="vencidos" />
                </View>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Atrasados" value={overdueReminders} icon="!" tone="danger" caption="sem conclusao" />
                </View>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Progresso" value={`${metrics.summary.routineProgressRate}%`} icon="R" caption="geral" />
                </View>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Sequencia" value={metrics.summary.streakDays} icon="S" tone="violet" caption="dias 100%" />
                </View>
              </View>

              <View style={[styles.grid, isMobile && styles.gridMobile, { gap }]}>
                <Card style={[styles.panel, styles.weekPanel]}>
                  <Text style={[styles.panelTitle, { fontSize: scaledFont(17, width) }]}>Semana</Text>
                  <Text style={[styles.panelSubtitle, { fontSize: scaledFont(12, width) }]}>
                    Volume de lembretes e taxa diaria de conclusao.
                  </Text>
                  <View style={styles.weekChart}>
                    {metrics.weekly.map((day) => {
                      const barHeight = 28 + Math.round((day.total / maxWeeklyTotal) * 86);
                      return (
                        <View key={day.date} style={styles.dayColumn}>
                          <View style={styles.dayBarShell}>
                            <View style={[styles.dayBar, { height: barHeight }]}>
                              <View
                                style={[
                                  styles.dayBarDone,
                                  { height: `${clampPercent(day.completionRate)}%` as `${number}%` }
                                ]}
                              />
                            </View>
                          </View>
                          <Text style={styles.dayRate}>{day.completionRate}%</Text>
                          <Text style={styles.dayLabel} numberOfLines={1}>{day.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>

                <Card style={styles.panel}>
                  <Text style={[styles.panelTitle, { fontSize: scaledFont(17, width) }]}>Resumo operacional</Text>
                  <View style={styles.kpiList}>
                    <KpiRow label="Cronogramas ativos" value={metrics.summary.activeSchedules} />
                    <KpiRow label="Lembretes criados" value={metrics.summary.totalReminders} />
                    <KpiRow label="Atrasados sem conclusao" value={overdueReminders} />
                    <KpiRow label="Feitos" value={metrics.summary.doneReminders} />
                    <KpiRow label="Adiados" value={metrics.summary.snoozedReminders} />
                    <KpiRow label="Pulados" value={metrics.summary.skippedReminders} />
                    <KpiRow label="Criados com IA" value={`${metrics.summary.aiAdoptionRate}%`} />
                  </View>
                </Card>
              </View>

              <View style={[styles.grid, isMobile && styles.gridMobile, { gap }]}>
                <Card style={styles.panel}>
                  <Text style={[styles.panelTitle, { fontSize: scaledFont(17, width) }]}>Categorias</Text>
                  <View style={styles.rankingList}>
                    {metrics.categories.length === 0 ? (
                      <Text style={styles.emptyText}>Crie cronogramas para ver categorias.</Text>
                    ) : (
                      metrics.categories.map((item) => {
                        const meta = getCategoryMeta(item.category);
                        return (
                          <View key={item.category} style={styles.rankingItem}>
                            <View style={styles.rankingHeader}>
                              <View style={[styles.rankingIcon, { backgroundColor: meta.background }]}>
                                <Text style={[styles.rankingIconText, { color: meta.color }]}>{meta.icon}</Text>
                              </View>
                              <View style={styles.rankingTextBox}>
                                <Text style={styles.rankingTitle}>{item.label}</Text>
                                <Text style={styles.rankingMeta}>
                                  {item.done}/{item.reminders} lembretes feitos
                                </Text>
                              </View>
                              <Text style={[styles.rankingRate, { color: meta.color }]}>{item.completionRate}%</Text>
                            </View>
                            <PercentBar value={item.completionRate} color={meta.color} />
                          </View>
                        );
                      })
                    )}
                  </View>
                </Card>

                <Card style={styles.panel}>
                  <Text style={[styles.panelTitle, { fontSize: scaledFont(17, width) }]}>Prioridades</Text>
                  <View style={styles.rankingList}>
                    {metrics.priorities.length === 0 ? (
                      <Text style={styles.emptyText}>Prioridades aparecem quando houver lembretes.</Text>
                    ) : (
                      metrics.priorities.map((item) => (
                        <View key={item.priority} style={styles.priorityRow}>
                          <View style={styles.priorityTop}>
                            <Text style={styles.priorityTitle}>{item.label}</Text>
                            <Text style={styles.priorityValue}>{item.completionRate}%</Text>
                          </View>
                          <PercentBar value={item.completionRate} color={colors.accent} />
                          <Text style={styles.priorityMeta}>{item.done}/{item.total} concluidos</Text>
                        </View>
                      ))
                    )}
                  </View>
                </Card>
              </View>

              <Card style={styles.panel}>
                <Text style={[styles.panelTitle, { fontSize: scaledFont(17, width) }]}>Insights</Text>
                <View style={styles.insightsGrid}>
                  {metrics.insights.map((insight, index) => (
                    <InsightCard key={`${insight}-${index}`} text={insight} index={index} />
                  ))}
                </View>
              </Card>
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

function KpiRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.kpiRow}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  backButtonSmall: {
    height: 38,
    paddingHorizontal: spacing.sm
  },
  backText: {
    color: colors.text,
    fontFamily: fonts.bold
  },
  scroll: {
    paddingBottom: spacing.xxxl
  },
  hero: {
    minHeight: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft
  },
  heroMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    borderRadius: radius.lg,
    padding: spacing.md
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D7FE"
  },
  heroIconMobile: {
    width: 58,
    height: 58,
    borderRadius: 18
  },
  heroIconText: {
    color: colors.primary,
    fontFamily: fonts.title
  },
  heroCopy: {
    flex: 1,
    minWidth: 0
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
    marginTop: spacing.sm,
    maxWidth: 580
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg
  },
  statItem: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 130
  },
  statItemSmall: {
    flexBasis: "48%",
    minWidth: 0
  },
  grid: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: spacing.lg
  },
  gridMobile: {
    flexDirection: "column"
  },
  panel: {
    flex: 1,
    padding: spacing.lg
  },
  weekPanel: {
    flex: 1.4
  },
  panelTitle: {
    color: colors.text,
    fontFamily: fonts.title
  },
  panelSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  weekChart: {
    minHeight: 168,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    minWidth: 0
  },
  dayBarShell: {
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%"
  },
  dayBar: {
    width: "72%",
    minWidth: 18,
    maxWidth: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  dayBarDone: {
    width: "100%",
    backgroundColor: colors.success,
    borderRadius: radius.pill
  },
  dayRate: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: spacing.sm
  },
  dayLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2
  },
  kpiList: {
    marginTop: spacing.md
  },
  kpiRow: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  kpiLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    flex: 1
  },
  kpiValue: {
    color: colors.text,
    fontFamily: fonts.title
  },
  rankingList: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  rankingItem: {
    gap: spacing.sm
  },
  rankingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  rankingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  rankingIconText: {
    fontFamily: fonts.title,
    fontSize: 16
  },
  rankingTextBox: {
    flex: 1,
    minWidth: 0
  },
  rankingTitle: {
    color: colors.text,
    fontFamily: fonts.bold
  },
  rankingMeta: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2
  },
  rankingRate: {
    fontFamily: fonts.title,
    fontSize: 16
  },
  percentTrack: {
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden"
  },
  percentFill: {
    height: "100%",
    borderRadius: radius.pill
  },
  priorityRow: {
    gap: spacing.sm
  },
  priorityTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  priorityTitle: {
    color: colors.text,
    fontFamily: fonts.bold
  },
  priorityValue: {
    color: colors.accent,
    fontFamily: fonts.title
  },
  priorityMeta: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md
  },
  insightCard: {
    flexGrow: 1,
    flexBasis: 240,
    minHeight: 82,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start"
  },
  insightNumber: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  insightNumberText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  insightText: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.medium,
    lineHeight: 20
  }
});
