import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "../../src/services/api";
import { Schedule } from "../../src/types/entities";
import { colors, spacing } from "../../src/theme";
import { Button, EmptyState, Input, LoadingState } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { ScheduleCard } from "../../src/components/ScheduleCard";

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
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

  const filteredSchedules = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return schedules;
    return schedules.filter((schedule) => schedule.title.toLowerCase().includes(term) || schedule.description?.toLowerCase().includes(term));
  }, [schedules, search]);

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader
            title="Cronogramas"
            subtitle="Organize suas rotinas por contexto"
            onMenu={isWide ? undefined : openMenu}
            right={<Pressable style={styles.addButton} onPress={() => router.push("/schedules/new")}><Text style={styles.addText}>＋</Text></Pressable>}
          />

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Biblioteca de rotinas</Text>
            <Text style={styles.panelText}>Separe seus lembretes por tratamento, estudos, treino, trabalho e metas pessoais.</Text>
            <View style={styles.actionRow}>
              <Button title="Novo cronograma" onPress={() => router.push("/schedules/new")} style={{ flex: 1 }} />
              <Button title="Criar com IA" variant="secondary" onPress={() => router.push("/ai-prompt")} style={{ flex: 1 }} />
            </View>
          </View>

          <Input value={search} onChangeText={setSearch} placeholder="Buscar cronograma..." style={styles.search} />

          {isLoading ? (
            <LoadingState label="Buscando cronogramas..." />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadSchedules(); }} />}
            >
              {filteredSchedules.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="Nenhum cronograma encontrado"
                  description="Crie um cronograma manual ou use a IA para montar uma rotina automaticamente."
                  action={<Button title="Criar com IA" onPress={() => router.push("/ai-prompt")} />}
                />
              ) : (
                filteredSchedules.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} onPress={() => router.push(`/schedules/${schedule.id}` as any)} />
                ))
              )}
            </ScrollView>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  addButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  addText: { color: colors.white, fontSize: 26, lineHeight: 28, fontWeight: "900" },
  panel: { backgroundColor: colors.dark, borderRadius: 28, padding: spacing.xl, marginBottom: spacing.lg },
  panelTitle: { color: colors.white, fontSize: 24, lineHeight: 30, fontWeight: "900" },
  panelText: { color: "#CBD5E1", fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  search: { marginBottom: spacing.md }
});
