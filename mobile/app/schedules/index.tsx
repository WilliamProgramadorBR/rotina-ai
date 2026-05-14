import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/services/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../../src/theme";
import { Button, Chip, EmptyState, LoadingState } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { ScheduleCard } from "../../src/components/ScheduleCard";
import { AiBadge, AiPanel } from "../../src/components/AiVisual";
import { IconSymbol } from "../../src/components/IconSymbol";
import { useResponsive } from "../../src/hooks/useResponsive";
import { useThemeMode } from "../../src/context/ThemeContext";

type Schedule = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  sourceType?: string | null;
  reminders?: Array<{ id: string; startAt?: string }>;
  progress?: {
    total: number;
    done: number;
    completionRate: number;
  };
};

const filters = [
  { key: "ALL", label: "Todos" },
  { key: "HEALTH", label: "Saude" },
  { key: "STUDY", label: "Estudo" },
  { key: "WORKOUT", label: "Treino" },
  { key: "WORK", label: "Trabalho" },
  { key: "PERSONAL", label: "Pessoal" }
];

export default function SchedulesScreen() {
  const { width, isPhone, isSmallPhone, gap } = useResponsive();
  const { theme } = useThemeMode();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const isMobile = isPhone || isSmallPhone;

  const loadSchedules = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get("/schedules");
      setSchedules(response.data.schedules || []);
    } catch (error: any) {
      console.log("[SCHEDULES ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar os cronogramas.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSchedules(); }, [loadSchedules]));

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const byCategory = activeCategory === "ALL" || schedule.category === activeCategory;
      const bySearch = !search || schedule.title.toLowerCase().includes(search) || String(schedule.description || "").toLowerCase().includes(search);
      return byCategory && bySearch;
    });
  }, [activeCategory, query, schedules]);

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Cronogramas"
            subtitle="Biblioteca inteligente de rotinas"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.newButton, { backgroundColor: theme.primary }, isSmallPhone && styles.newButtonSmall]}
                onPress={() => router.push("/schedules/new")}
              >
                <IconSymbol name="plus" size={16} color={colors.white} />
                <Text style={[styles.newButtonText, { fontSize: scaledFont(13, width) }]}>
                  {isMobile ? "Novo" : "Novo cronograma"}
                </Text>
              </Pressable>
            }
          />

          <AiPanel
            title="Biblioteca inteligente de rotinas."
            description="Encontre cronogramas, acompanhe progresso e crie novas rotinas com IA ou manualmente."
            icon="format-list-checks"
            metric={`${schedules.length}`}
            metricLabel="cronogramas"
            compact={isMobile}
            style={styles.aiPanel}
          >
            <View style={styles.heroBadges}>
              <AiBadge label={`${filtered.length} visiveis`} tone="blue" />
              <AiBadge label={activeCategory === "ALL" ? "todos os tipos" : activeCategory.toLowerCase()} tone="violet" />
            </View>
          </AiPanel>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }, isSmallPhone && styles.searchBoxSmall]}>
            <View style={[styles.searchIconBox, { backgroundColor: theme.primarySoft }]}>
              <IconSymbol name="magnify" size={16} color={theme.primary} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar cronogramas..."
              placeholderTextColor={theme.textSoft}
              style={[styles.searchInput, { color: theme.text, fontSize: scaledFont(14, width) }]}
            />
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chips, { gap: spacing.sm }]}
          >
            {filters.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                active={activeCategory === filter.key}
                onPress={() => setActiveCategory(filter.key)}
                size={isSmallPhone ? "sm" : "md"}
              />
            ))}
          </ScrollView>

          {/* List */}
          {isLoading ? (
            <LoadingState label="Carregando cronogramas..." />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => { setIsRefreshing(true); loadSchedules(true); }}
                />
              }
              contentContainerStyle={styles.list}
            >
              {filtered.length === 0 ? (
                <EmptyState
                  iconName="format-list-checks"
                  title="Nenhum cronograma encontrado"
                  description="Crie uma rotina manual ou transforme uma ideia em cronograma com IA."
                  action={<Button title="Novo cronograma" icon="plus" onPress={() => router.push("/schedules/new")} fullWidth />}
                />
              ) : (
                filtered.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} />)
              )}

              {filtered.length > 0 ? (
                <Text style={[styles.footer, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                  Exibindo {filtered.length} de {schedules.length} cronogramas
                </Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  newButton: {
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    ...shadow.soft
  },
  newButtonSmall: {
    height: 38,
    paddingHorizontal: spacing.sm
  },
  newButtonText: {
    color: colors.white,
    fontFamily: fonts.bold
  },
  aiPanel: {
    marginBottom: spacing.lg
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },

  hero: {
    minHeight: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    ...shadow.soft
  },
  heroMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: "auto"
  },

  aiOrb: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    alignItems: "center",
    justifyContent: "center"
  },
  aiOrbMobile: {
    width: 52,
    height: 52,
    borderRadius: 18
  },
  aiOrbText: {
    color: colors.accent,
    fontFamily: fonts.title
  },

  heroKickerBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: spacing.xs
  },
  heroKicker: {
    color: colors.primary,
    fontFamily: fonts.bold,
    letterSpacing: 0.5
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.title
  },
  heroText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.xs
  },

  heroPanel: {
    width: 100,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  heroPanelText: {
    color: colors.primary,
    fontFamily: fonts.title,
    fontSize: 28
  },

  searchBox: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  searchBoxSmall: {
    height: 44
  },

  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  searchIcon: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular
  },

  chips: {
    paddingBottom: spacing.lg
  },

  list: {
    paddingBottom: spacing.xxxl
  },

  footer: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    textAlign: "center",
    marginTop: spacing.lg
  }
});
