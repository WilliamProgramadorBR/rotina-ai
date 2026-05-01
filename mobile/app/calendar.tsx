import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { router } from "expo-router";
import { Calendar, DateData } from "react-native-calendars";
import { api } from "../src/services/api";

type Reminder = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  timezone?: string;
  schedule?: {
    id: string;
    title: string;
    category: string;
  };
  logs?: Array<{
    id: string;
    action: string;
    createdAt: string;
  }>;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthRange(dateKey: string) {
  const [year, month] = dateKey.split("-").map(Number);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    start: toDateKey(start),
    end: toDateKey(end)
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getCategoryLabel(category?: string) {
  const labels: Record<string, string> = {
    HEALTH: "Saúde",
    STUDY: "Estudo",
    WORKOUT: "Treino",
    WORK: "Trabalho",
    SLEEP: "Sono",
    WATER: "Água",
    PERSONAL: "Pessoal",
    OTHER: "Outro"
  };

  return labels[category || "OTHER"] || "Outro";
}

export default function CalendarScreen() {
  const today = toDateKey(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const loadReminders = useCallback(async (dateKey: string) => {
    try {
      setIsLoading(true);

      const { start, end } = getMonthRange(dateKey);

      const response = await api.get("/reminders/range", {
        params: {
          start,
          end
        }
      });

      setReminders(response.data.reminders || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders(currentMonth);
  }, [currentMonth, loadReminders]);

  const remindersByDate = useMemo(() => {
    return reminders.reduce<Record<string, Reminder[]>>((acc, reminder) => {
      const key = toDateKey(new Date(reminder.startAt));

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(reminder);

      return acc;
    }, {});
  }, [reminders]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(remindersByDate).forEach((dateKey) => {
      const count = remindersByDate[dateKey].length;

      marks[dateKey] = {
        marked: true,
        dots: [
          {
            key: "reminders",
            color: count >= 5 ? "#F97316" : "#2563EB"
          }
        ]
      };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: "#101828",
      selectedTextColor: "#FFFFFF"
    };

    return marks;
  }, [remindersByDate, selectedDate]);

  const selectedReminders = remindersByDate[selectedDate] || [];

  function handleDayPress(day: DateData) {
    setSelectedDate(day.dateString);
  }

  function handleMonthChange(day: DateData) {
    setCurrentMonth(day.dateString);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calendário</Text>
          <Text style={styles.subtitle}>Veja seus alarmes e cronogramas por dia.</Text>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            backgroundColor: "#FFFFFF",
            calendarBackground: "#FFFFFF",
            textSectionTitleColor: "#667085",
            selectedDayBackgroundColor: "#101828",
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: "#2563EB",
            dayTextColor: "#101828",
            textDisabledColor: "#D0D5DD",
            monthTextColor: "#101828",
            arrowColor: "#101828",
            textMonthFontWeight: "800",
            textDayFontWeight: "600",
            textDayHeaderFontWeight: "700"
          }}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long"
          })}
        </Text>

        <Text style={styles.countText}>
          {selectedReminders.length} lembrete{selectedReminders.length === 1 ? "" : "s"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 28 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {selectedReminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nada agendado neste dia</Text>
              <Text style={styles.emptyText}>
                Use a IA ou crie um lembrete manual para preencher sua rotina.
              </Text>
            </View>
          ) : (
            selectedReminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>{formatTime(reminder.startAt)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>

                  {reminder.description ? (
                    <Text style={styles.reminderDescription}>
                      {reminder.description}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <Text style={styles.metaPill}>
                      {getCategoryLabel(reminder.schedule?.category)}
                    </Text>

                    {reminder.schedule?.title ? (
                      <Text style={styles.scheduleText} numberOfLines={1}>
                        {reminder.schedule.title}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
    paddingTop: 54,
    paddingHorizontal: 18
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#101828"
  },
  subtitle: {
    color: "#667085",
    marginTop: 4,
    maxWidth: 240
  },
  backButton: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAECF0"
  },
  backButtonText: {
    fontWeight: "800",
    color: "#101828"
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: "#EAECF0"
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#101828",
    textTransform: "capitalize",
    flex: 1
  },
  countText: {
    color: "#667085",
    fontWeight: "700"
  },
  list: {
    paddingBottom: 32
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EAECF0"
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#101828"
  },
  emptyText: {
    color: "#667085",
    marginTop: 8,
    lineHeight: 20
  },
  reminderCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAECF0"
  },
  timeBadge: {
    width: 66,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center"
  },
  timeText: {
    color: "#2563EB",
    fontWeight: "900"
  },
  reminderTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: "900"
  },
  reminderDescription: {
    color: "#667085",
    marginTop: 5,
    lineHeight: 19
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },
  metaPill: {
    backgroundColor: "#F2F4F7",
    color: "#344054",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800"
  },
  scheduleText: {
    color: "#667085",
    fontWeight: "700",
    flex: 1
  }
});