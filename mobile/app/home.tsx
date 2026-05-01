import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { createReminderLogRequest, listTodayRemindersRequest } from "@/services/reminders";
import { cancelReminderNotification, scheduleSnoozeNotification } from "@/services/notifications";
import { Reminder, ReminderAction } from "@/types/api";
import { formatTime } from "@/utils/date";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadTodayReminders() {
    const data = await listTodayRemindersRequest();
    setReminders(data);
  }

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        try {
          setLoading(true);
          const data = await listTodayRemindersRequest();

          if (isActive) {
            setReminders(data);
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

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadTodayReminders();
    } catch (error) {
      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLog(reminder: Reminder, action: ReminderAction) {
    try {
      await createReminderLogRequest(reminder.id, { action });

      if (action === "SNOOZED") {
        await scheduleSnoozeNotification(reminder, 10);
      }

      if (action === "DONE" || action === "SKIPPED") {
        await cancelReminderNotification(reminder.id);
      }

      await loadTodayReminders();
    } catch (error) {
      Alert.alert("Erro", getApiErrorMessage(error));
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading) {
    return <LoadingState message="Buscando lembretes de hoje..." />;
  }

  return (
    <Screen
      scroll
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(" ")[0] || "usuário"}</Text>
          <Text style={styles.title}>Sua rotina de hoje</Text>
        </View>
        <Button title="Sair" variant="ghost" onPress={handleLogout} style={styles.logoutButton} />
      </View>

      <View style={styles.actions}>
        <Button title="Cronogramas" variant="secondary" onPress={() => router.push("/schedules")} />
        <Button title="Prompt IA" variant="secondary" onPress={() => router.push("/ai-prompt")} />
        <Button title="Teste notificação" variant="secondary" onPress={() => router.push("/notifications-test")} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lembretes de hoje</Text>

        {reminders.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>Nada agendado para hoje.</Text>
            <Text style={styles.emptyText}>Crie um cronograma e adicione seu primeiro lembrete.</Text>
            <Button title="Criar cronograma" onPress={() => router.push("/schedules/new")} />
          </Card>
        ) : (
          reminders.map((reminder) => {
            const lastLog = reminder.logs?.[0];

            return (
              <Card key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.reminderTime}>{formatTime(reminder.startAt)}</Text>
                  <Text style={styles.category}>{reminder.schedule?.category || "OTHER"}</Text>
                </View>

                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                {!!reminder.description && <Text style={styles.reminderDescription}>{reminder.description}</Text>}
                {!!lastLog && <Text style={styles.lastLog}>Última ação: {lastLog.action}</Text>}

                <View style={styles.logActions}>
                  <Button title="Feito" onPress={() => handleLog(reminder, "DONE")} style={styles.smallButton} />
                  <Button title="Adiar" variant="secondary" onPress={() => handleLog(reminder, "SNOOZED")} style={styles.smallButton} />
                  <Button title="Pular" variant="danger" onPress={() => handleLog(reminder, "SKIPPED")} style={styles.smallButton} />
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  greeting: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "800",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  logoutButton: {
    minHeight: 40,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "900",
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  reminderCard: {
    gap: 12,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderTime: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "900",
  },
  category: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
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
  lastLog: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "700",
  },
  logActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  smallButton: {
    minHeight: 44,
    flexGrow: 1,
  },
});
