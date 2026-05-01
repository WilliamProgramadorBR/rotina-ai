import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { getApiErrorMessage } from "@/services/api";
import { listSchedulesRequest } from "@/services/schedules";
import { Schedule } from "@/types/api";

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        try {
          setLoading(true);
          const data = await listSchedulesRequest();
          if (isActive) {
            setSchedules(data);
          }
        } catch (error) {
          Alert.alert("Erro", getApiErrorMessage(error));
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      }

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  if (loading) {
    return <LoadingState message="Carregando cronogramas..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.back} onPress={() => router.back()}>← Voltar</Text>
          <Text style={styles.title}>Cronogramas</Text>
          <Text style={styles.subtitle}>Separe remédios, estudos, treino e tarefas por contexto.</Text>
        </View>
      </View>

      <Button title="Novo cronograma" onPress={() => router.push("/schedules/new")} />

      <View style={styles.list}>
        {schedules.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>Nenhum cronograma criado.</Text>
            <Text style={styles.emptyText}>Crie seu primeiro cronograma para agrupar lembretes.</Text>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Pressable key={schedule.id} onPress={() => router.push(`/schedules/${schedule.id}`)}>
              <Card>
                <Text style={styles.scheduleCategory}>{schedule.category}</Text>
                <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                {!!schedule.description && <Text style={styles.scheduleDescription}>{schedule.description}</Text>}
                <Text style={styles.reminderCount}>{schedule.reminders?.length || 0} lembrete(s)</Text>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  back: {
    color: "#93C5FD",
    marginBottom: 12,
    fontWeight: "800",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 12,
    marginTop: 20,
  },
  scheduleCategory: {
    color: "#22C55E",
    fontWeight: "900",
    fontSize: 12,
  },
  scheduleTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
  },
  scheduleDescription: {
    color: "#94A3B8",
    lineHeight: 21,
  },
  reminderCount: {
    color: "#CBD5E1",
    fontWeight: "700",
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: "#94A3B8",
    lineHeight: 22,
  },
});
