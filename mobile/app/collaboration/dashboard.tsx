import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { CollaborationDashboardMetrics } from "@/types/api";
import { getCollaborationDashboardMetricsRequest } from "@/services/metrics";
import { AiBadge, AiPanel } from "@/components/AiVisual";
import { Card, EmptyState, LoadingState, StatCard } from "@/components/ui";
import { IconSymbol } from "@/components/IconSymbol";
import { PageHeader } from "@/components/PageHeader";
import { ScreenLayout } from "@/components/ScreenLayout";
import { colors, fonts, radius, spacing, scaledFont } from "@/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeMode } from "@/context/ThemeContext";

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

export default function CollaborationDashboardScreen() {
  const { width, isPhone, isSmallPhone, isPhoneLarge, gap } = useResponsive();
  const { theme } = useThemeMode();
  const [metrics, setMetrics] = useState<CollaborationDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMobile = isPhone || isSmallPhone || isPhoneLarge;
  const maxWeeklyTotal = useMemo(() => {
    return Math.max(...(metrics?.weekly || []).map((item) => item.total), 1);
  }, [metrics]);

  const loadMetrics = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const nextMetrics = await getCollaborationDashboardMetricsRequest();
      setMetrics(nextMetrics);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar as metricas dos grupos.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMetrics(); }, [loadMetrics]));

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Dashboard de grupos"
            subtitle="Metricas de tarefas compartilhadas"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push("/collaboration")}
              >
                <IconSymbol name="account-group-outline" size={16} color={theme.text} />
                {!isSmallPhone ? <Text style={[styles.backText, { color: theme.text }]}>Grupos</Text> : null}
              </Pressable>
            }
          />

          {isLoading ? (
            <LoadingState label="Calculando indicadores dos grupos..." />
          ) : !metrics ? (
            <EmptyState
              iconName="chart-box-outline"
              title="Sem metricas"
              description="Nao foi possivel montar o dashboard colaborativo agora."
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
              <AiPanel
                eyebrow="COLABORACAO"
                title={`${metrics.summary.totalGroups} ${metrics.summary.totalGroups === 1 ? "grupo acompanhado" : "grupos acompanhados"}`}
                description="Veja desempenho por grupo, participacao dos membros, comentarios e tarefas compartilhadas sem misturar com seu uso individual."
                icon="account-group-outline"
                metric={`${metrics.summary.completionRate}%`}
                metricLabel="conclusao"
                tone={metrics.summary.overdueReminders ? "amber" : "green"}
                compact={isMobile}
                style={styles.heroPanel}
              >
                <View style={styles.heroBadges}>
                  <AiBadge label={`${metrics.summary.activeGroups} ativos`} tone="cyan" />
                  <AiBadge label={`${metrics.summary.totalComments} comentarios`} tone="violet" />
                </View>
              </AiPanel>

              <View style={[styles.stats, { gap }]}>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Grupos" value={metrics.summary.totalGroups} iconName="account-group-outline" caption="participando" />
                </View>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Conclusao" value={`${metrics.summary.completionRate}%`} iconName="check-circle-outline" tone="green" caption="vencidos" />
                </View>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Tarefas" value={metrics.summary.totalReminders} iconName="format-list-checks" caption="em grupos" />
                </View>
                <View style={[styles.statItem, isSmallPhone && styles.statItemSmall]}>
                  <StatCard title="Comentarios" value={metrics.summary.totalComments} iconName="comment-text-outline" tone="violet" caption="nas tarefas" />
                </View>
              </View>

              <View style={[styles.grid, isMobile && styles.gridMobile, { gap }]}>
                <Card style={[styles.panel, styles.weekPanel]}>
                  <Text style={[styles.panelTitle, { color: theme.text, fontSize: scaledFont(17, width) }]}>Semana dos grupos</Text>
                  <Text style={[styles.panelSubtitle, { color: theme.textMuted }]}>Volume de tarefas compartilhadas e conclusao diaria.</Text>
                  <View style={styles.weekChart}>
                    {metrics.weekly.map((day) => {
                      const barHeight = 28 + Math.round((day.total / maxWeeklyTotal) * 86);
                      return (
                        <View key={day.date} style={styles.dayColumn}>
                          <View style={styles.dayBarShell}>
                            <View style={[styles.dayBar, { height: barHeight }]}>
                              <View style={[styles.dayBarDone, { height: `${clampPercent(day.completionRate)}%` as `${number}%` }]} />
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
                  <Text style={[styles.panelTitle, { color: theme.text, fontSize: scaledFont(17, width) }]}>Leitura rapida</Text>
                  <View style={styles.insightList}>
                    {metrics.insights.map((insight, index) => (
                      <View key={`${insight}-${index}`} style={[styles.insightRow, { borderBottomColor: theme.border }]}>
                        <View style={[styles.insightDot, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.insightText, { color: theme.text }]}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Grupos</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Cada grupo tem progresso e participacao separados.</Text>
              </View>

              {metrics.groups.length === 0 ? (
                <EmptyState
                  iconName="account-group-outline"
                  title="Nenhum grupo ainda"
                  description="Crie ou aceite um convite para acompanhar metricas colaborativas."
                />
              ) : (
                <View style={styles.groupList}>
                  {metrics.groups.map((group) => (
                    <Pressable key={group.groupId} onPress={() => router.push(`/collaboration/${group.groupId}` as any)}>
                      <Card style={styles.groupCard}>
                        <View style={styles.groupHeader}>
                          <View style={[styles.groupIcon, { backgroundColor: theme.primarySoft }]}>
                            <IconSymbol name="account-group-outline" size={22} color={theme.primary} />
                          </View>
                          <View style={styles.groupTitleBox}>
                            <Text style={[styles.groupTitle, { color: theme.text }]} numberOfLines={1}>{group.groupName}</Text>
                            <Text style={[styles.groupSubtitle, { color: theme.textMuted }]} numberOfLines={2}>
                              {group.description || `${group.members} membros, ${group.summary.totalReminders} tarefas compartilhadas`}
                            </Text>
                          </View>
                          <Text style={[styles.groupRate, { color: theme.success }]}>{group.summary.completionRate}%</Text>
                          <IconSymbol name="chevron-right" size={20} color={theme.textMuted} />
                        </View>

                        <PercentBar value={group.summary.completionRate} color={theme.success} />

                        <View style={styles.groupKpis}>
                          <MiniKpi label="Membros" value={group.members} />
                          <MiniKpi label="Rotinas" value={group.schedules} />
                          <MiniKpi label="Feitas" value={group.summary.doneReminders} />
                          <MiniKpi label="Comentarios" value={group.comments} />
                        </View>

                        <View style={[styles.contributorBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                          <Text style={[styles.contributorTitle, { color: theme.text }]}>Participacao</Text>
                          {group.topContributors.length === 0 ? (
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sem conclusoes registradas ainda.</Text>
                          ) : (
                            group.topContributors.map((member) => (
                              <View key={member.userId} style={styles.contributorRow}>
                                <Text style={[styles.contributorName, { color: theme.text }]} numberOfLines={1}>{member.name}</Text>
                                <Text style={[styles.contributorValue, { color: theme.textMuted }]}>
                                  {member.done} feita{member.done === 1 ? "" : "s"}
                                </Text>
                              </View>
                            ))
                          )}
                        </View>
                      </Card>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

function MiniKpi({ label, value }: { label: string; value: string | number }) {
  const { theme } = useThemeMode();

  return (
    <View style={[styles.miniKpi, { borderColor: theme.border }]}>
      <Text style={[styles.miniKpiValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.miniKpiLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  backText: {
    fontFamily: fonts.bold
  },
  scroll: {
    paddingBottom: spacing.xxxl
  },
  heroPanel: {
    marginBottom: spacing.lg
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
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
    flex: 1.35
  },
  panelTitle: {
    fontFamily: fonts.title
  },
  panelSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
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
  insightList: {
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  insightRow: {
    minHeight: 42,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6
  },
  insightText: {
    flex: 1,
    fontFamily: fonts.medium,
    lineHeight: 20
  },
  sectionHeader: {
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: 18
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  groupList: {
    gap: spacing.md
  },
  groupCard: {
    gap: spacing.md
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center"
  },
  groupTitleBox: {
    flex: 1,
    minWidth: 0
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  groupSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  groupRate: {
    fontFamily: fonts.title,
    fontSize: 18
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
  groupKpis: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  miniKpi: {
    flexGrow: 1,
    flexBasis: 120,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  miniKpiValue: {
    fontFamily: fonts.title,
    fontSize: 16
  },
  miniKpiLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2
  },
  contributorBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm
  },
  contributorTitle: {
    fontFamily: fonts.bold
  },
  contributorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  contributorName: {
    flex: 1,
    fontFamily: fonts.medium
  },
  contributorValue: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  emptyText: {
    fontFamily: fonts.regular,
    lineHeight: 18
  }
});
