import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/services/api";
import { colors, fonts, radius, shadow, spacing } from "../../src/theme";
import { Button, Chip, EmptyState, LoadingState } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { ScheduleCard } from "../../src/components/ScheduleCard";

type Schedule = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  sourceType?: string | null;
  reminders?: Array<{ id: string; startAt?: string }>;
};

const filters = [
  { key: "ALL", label: "Todos" },
  { key: "HEALTH", label: "Saúde" },
  { key: "STUDY", label: "Estudo" },
  { key: "WORKOUT", label: "Treino" },
  { key: "WORK", label: "Trabalho" },
  { key: "PERSONAL", label: "Pessoal" }
];

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const loadSchedules = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get("/schedules");
      setSchedules(response.data.schedules || []);
    } catch (error: any) {
      console.log("[SCHEDULES ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível carregar os cronogramas.");
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
              <Pressable style={styles.newButton} onPress={() => router.push("/schedules/new")}> 
                <Text style={styles.newButtonText}>＋ Novo cronograma</Text>
              </Pressable>
            }
          />

          <View style={styles.hero}>
            <View style={styles.aiOrb}><Text style={styles.aiOrbText}>AI</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroKicker}>ASSISTENTE DE ROTINA AI</Text>
              <Text style={styles.heroTitle}>Organize seus dias com inteligência.</Text>
              <Text style={styles.heroText}>Seus cronogramas, lembretes e metas em um só lugar. Crie rotinas personalizadas e receba lembretes no momento certo.</Text>
            </View>
            <View style={styles.heroPanel}><Text style={styles.heroPanelText}>□✓</Text></View>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar cronogramas..."
            placeholderTextColor={colors.textSoft}
            style={styles.search}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {filters.map((filter) => (
              <Chip key={filter.key} label={filter.label} active={activeCategory === filter.key} onPress={() => setActiveCategory(filter.key)} />
            ))}
          </ScrollView>

          {isLoading ? (
            <LoadingState label="Carregando cronogramas..." />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadSchedules(true); }} />}
              contentContainerStyle={styles.list}
            >
              {filtered.length === 0 ? (
                <EmptyState
                  icon="□"
                  title="Nenhum cronograma encontrado"
                  description="Crie uma rotina manual ou transforme uma ideia em cronograma com IA."
                  action={<Button title="Novo cronograma" onPress={() => router.push("/schedules/new")} />}
                />
              ) : (
                filtered.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} />)
              )}

              {filtered.length > 0 ? <Text style={styles.footer}>Exibindo {filtered.length} de {schedules.length} cronogramas</Text> : null}
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  newButton: { height: 46, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", ...shadow.soft },
  newButtonText: { color: colors.white, fontFamily: fonts.bold },
  hero: { minHeight: 154, backgroundColor: colors.surface, borderRadius: 32, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.xl, ...shadow.soft },
  aiOrb: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: "#E9D5FF", alignItems: "center", justifyContent: "center" },
  aiOrbText: { color: colors.accent, fontFamily: fonts.title, fontSize: 22 },
  heroKicker: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  heroTitle: { color: colors.text, fontFamily: fonts.title, fontSize: 24, marginTop: spacing.sm },
  heroText: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 22, marginTop: spacing.sm, maxWidth: 680 },
  heroPanel: { width: 140, height: 100, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  heroPanelText: { color: colors.primary, fontFamily: fonts.title, fontSize: 32 },
  search: { height: 54, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, color: colors.text, fontFamily: fonts.regular, fontSize: 15, marginBottom: spacing.lg },
  chips: { gap: spacing.sm, paddingBottom: spacing.lg },
  list: { paddingBottom: spacing.xxxl },
  footer: { color: colors.textMuted, fontFamily: fonts.medium, textAlign: "center", marginTop: spacing.lg }
});
