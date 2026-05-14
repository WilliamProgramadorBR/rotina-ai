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
import { useThemeMode } from "../src/context/ThemeContext";
import { formatOverdueLabel, isReminderOverdue } from "../src/utils/reminderStatus";

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
    HEALTH: "Saude",
    STUDY: "Estudo",
    WORKOUT: "Treino",
    WORK: "Trabalho",
    SLEEP: "Sono",
    WATER: "Agua",
    PERSONAL: "Pessoal",
    OTHER: "Outro"
  };

  return labels[category || "OTHER"] || "Outro";
}

export default function CalendarScreen() {
  const { theme, isDark } = useThemeMode();
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
      const dayReminders = remindersByDate[dateKey];
      const count = dayReminders.length;
      const hasOverdue = dayReminders.some(isReminderOverdue);

      marks[dateKey] = {
        marked: true,
        dots: [
          {
            key: "reminders",
            color: hasOverdue ? theme.danger : count >= 5 ? theme.warning : theme.primary
          }
        ]
      };
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: theme.primary,
      selectedTextColor: "#FFFFFF"
    };

    return marks;
  }, [remindersByDate, selectedDate, theme]);

  const selectedReminders = remindersByDate[selectedDate] || [];

  function handleDayPress(day: DateData) {
    setSelectedDate(day.dateString);
  }

  function handleMonthChange(day: DateData) {
    setCurrentMonth(day.dateString);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Calendario</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Veja seus alarmes e cronogramas por dia.
          </Text>
        </View>

        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: theme.text }]}>Voltar</Text>
        </Pressable>
      </View>

      <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Calendar
          current={selectedDate}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            backgroundColor: theme.surface,
            calendarBackground: theme.surface,
            textSectionTitleColor: theme.textMuted,
            selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: theme.primary,
            dayTextColor: theme.text,
            textDisabledColor: theme.textSoft,
            monthTextColor: theme.text,
            arrowColor: theme.text,
            textMonthFontWeight: "800",
            textDayFontWeight: "600",
            textDayHeaderFontWeight: "700"
          }}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long"
          })}
        </Text>

        <Text style={[styles.countText, { color: theme.textMuted }]}>
          {selectedReminders.length} lembrete{selectedReminders.length === 1 ? "" : "s"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 28 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {selectedReminders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nada agendado neste dia</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Use a IA ou crie um lembrete manual para preencher sua rotina.
              </Text>
            </View>
          ) : (
            selectedReminders.map((reminder) => {
              const overdue = isReminderOverdue(reminder);

              return (
                <View
                  key={reminder.id}
                  style={[
                    styles.reminderCard,
                    {
                      backgroundColor: overdue ? (isDark ? theme.dangerSoft : "#FFF7F8") : theme.surface,
                      borderColor: overdue ? (isDark ? theme.danger : "#FECDD6") : theme.border
                    }
                  ]}
                >
                  <View
                    style={[
                      styles.timeBadge,
                      {
                        backgroundColor: overdue
                          ? isDark ? theme.dangerSoft : "#FFF1F2"
                          : theme.primarySoft
                      }
                    ]}
                  >
                    <Text style={[styles.timeText, { color: overdue ? theme.danger : theme.primary }]}>
                      {formatTime(reminder.startAt)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reminderTitle, { color: theme.text }]}>{reminder.title}</Text>

                    {reminder.description ? (
                      <Text style={[styles.reminderDescription, { color: theme.textMuted }]}>
                        {reminder.description}
                      </Text>
                    ) : null}

                    <View style={styles.metaRow}>
                      <Text style={[styles.metaPill, { backgroundColor: theme.surfaceMuted, color: theme.textMuted }]}>
                        {getCategoryLabel(reminder.schedule?.category)}
                      </Text>

                      {overdue ? (
                        <Text style={[styles.overduePill, { backgroundColor: theme.dangerSoft, color: theme.danger }]}>
                          {formatOverdueLabel(reminder.startAt)}
                        </Text>
                      ) : null}

                      {reminder.schedule?.title ? (
                        <Text style={[styles.scheduleText, { color: theme.textMuted }]} numberOfLines={1}>
                          {reminder.schedule.title}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 4,
    maxWidth: 240
  },
  backButton: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  backButtonText: {
    fontWeight: "800"
  },
  calendarCard: {
    borderRadius: 24,
    padding: 8,
    borderWidth: 1
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
    textTransform: "capitalize",
    flex: 1
  },
  countText: {
    fontWeight: "700"
  },
  list: {
    paddingBottom: 32
  },
  emptyCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  emptyText: {
    marginTop: 8,
    lineHeight: 20
  },
  reminderCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1
  },
  timeBadge: {
    width: 66,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  timeText: {
    fontWeight: "900"
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "900"
  },
  reminderDescription: {
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800"
  },
  overduePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "900"
  },
  scheduleText: {
    fontWeight: "700",
    flex: 1
  }
});
