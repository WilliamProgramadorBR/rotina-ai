import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { getApiErrorMessage } from "@/services/api";
import { deleteScheduleRequest, getScheduleRequest } from "@/services/schedules";
import { Schedule } from "@/types/api";
import { formatDateTime } from "@/utils/date";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        try {
          if (!id) {
            return;
          }

          setLoading(true);
          const data = await getScheduleRequest(id);

          if (isActive) {
            setSchedule(data);
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
    }, [id])
  );

  async function handleDelete() {
    if (!id) {
      return;
    }

    Alert.alert("Remover cronograma", "Tem certeza que deseja remover este cronograma e seus lembretes?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteScheduleRequest(id);
            router.replace("/schedules");
          } catch (error) {
            Alert.alert("Erro", getApiErrorMessage(error));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return <LoadingState message="Carregando cronograma..." />;
  }

  if (!schedule) {
    return (
      <Screen>
        <Text style={styles.title}>Cronograma não encontrado.</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>← Voltar</Text>
        <Text style={styles.category}>{schedule.category}</Text>
        <Text style={styles.title}>{schedule.title}</Text>
        {!!schedule.description && <Text style={styles.subtitle}>{schedule.description}</Text>}
      </View>

      <View style={styles.actions}>
        <Button title="Novo lembrete" onPress={() => router.push(`/reminders/new?scheduleId=${schedule.id}`)} />
        <Button title="Remover" variant="danger" onPress={handleDelete} loading={deleting} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lembretes</Text>

        {schedule.reminders?.length ? (
          schedule.reminders.map((reminder) => (
            <Card key={reminder.id}>
              <Text style={styles.reminderDate}>{formatDateTime(reminder.startAt)}</Text>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              {!!reminder.description && <Text style={styles.reminderDescription}>{reminder.description}</Text>}
              <Text style={styles.reminderStatus}>Status: {reminder.status}</Text>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.emptyTitle}>Nenhum lembrete neste cronograma.</Text>
            <Text style={styles.emptyText}>Adicione o primeiro horário para começar.</Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 22,
  },
  back: {
    color: "#93C5FD",
    marginBottom: 12,
    fontWeight: "800",
  },
  category: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: 8,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginBottom: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
  },
  reminderDate: {
    color: "#22C55E",
    fontWeight: "900",
  },
  reminderTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
  },
  reminderDescription: {
    color: "#94A3B8",
    lineHeight: 21,
  },
  reminderStatus: {
    color: "#CBD5E1",
    fontWeight: "800",
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
