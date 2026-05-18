import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useThemeMode } from "../context/ThemeContext";
import { colors, fonts, radius, spacing } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (minutes: number, label: string) => void;
};

const PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hora", minutes: 60 },
  { label: "2 horas", minutes: 120 },
];

function tomorrowString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function Spinner({
  label,
  value,
  onDecrement,
  onIncrement,
  display,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  display?: string;
}) {
  const { theme } = useThemeMode();
  return (
    <View style={styles.spinnerGroup}>
      <Text style={[styles.spinnerLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={[styles.spinner, { borderColor: theme.border }]}>
        <Pressable onPress={onDecrement} style={styles.spinnerBtn} hitSlop={8}>
          <Text style={[styles.spinnerBtnText, { color: theme.primary }]}>−</Text>
        </Pressable>
        <Text style={[styles.spinnerValue, { color: theme.text }]}>{display ?? String(value)}</Text>
        <Pressable onPress={onIncrement} style={styles.spinnerBtn} hitSlop={8}>
          <Text style={[styles.spinnerBtnText, { color: theme.primary }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SnoozePickerModal({ visible, onClose, onConfirm }: Props) {
  const { theme, isDark } = useThemeMode();
  const [tab, setTab] = useState<"today" | "future">("today");
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [selectedDate, setSelectedDate] = useState(tomorrowString());
  const [futureHour, setFutureHour] = useState(8);
  const [futureMinute, setFutureMinute] = useState(0);

  function handlePreset(minutes: number, label: string) {
    onConfirm(minutes, label);
    onClose();
  }

  function handleCustomToday() {
    const total = customHours * 60 + customMinutes;
    if (total <= 0) return;
    const label =
      customHours > 0
        ? `${customHours}h${customMinutes > 0 ? ` ${customMinutes}min` : ""}`
        : `${customMinutes} min`;
    onConfirm(total, label);
    onClose();
  }

  function handleFutureConfirm() {
    const h = String(futureHour).padStart(2, "0");
    const m = String(futureMinute).padStart(2, "0");
    const target = new Date(`${selectedDate}T${h}:${m}:00`);
    const minutesFromNow = Math.round((target.getTime() - Date.now()) / 60000);
    if (minutesFromNow <= 0) return;
    const dateParts = target.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    onConfirm(minutesFromNow, `${dateParts} às ${h}:${m}`);
    onClose();
  }

  const calendarTheme = {
    backgroundColor: theme.surface,
    calendarBackground: theme.surface,
    textSectionTitleColor: theme.textMuted,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: "#fff",
    todayTextColor: colors.primary,
    dayTextColor: theme.text,
    arrowColor: colors.primary,
    monthTextColor: theme.text,
    textDisabledColor: theme.textMuted,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          <Text style={[styles.title, { color: theme.text }]}>Adiar tarefa</Text>

          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <Pressable
              style={[styles.tab, tab === "today" && { backgroundColor: theme.surface }]}
              onPress={() => setTab("today")}
            >
              <Text style={[styles.tabText, { color: tab === "today" ? theme.primary : theme.textMuted }]}>
                Hoje
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === "future" && { backgroundColor: theme.surface }]}
              onPress={() => setTab("future")}
            >
              <Text style={[styles.tabText, { color: tab === "future" ? theme.primary : theme.textMuted }]}>
                Outro dia
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {tab === "today" ? (
              <View style={styles.section}>
                {/* Presets */}
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Rápido</Text>
                <View style={styles.presets}>
                  {PRESETS.map((p) => (
                    <Pressable
                      key={p.minutes}
                      style={[styles.presetBtn, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}
                      onPress={() => handlePreset(p.minutes, p.label)}
                    >
                      <Text style={[styles.presetText, { color: theme.text }]}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Custom */}
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Personalizado</Text>
                <View style={styles.spinners}>
                  <Spinner
                    label="Horas"
                    value={customHours}
                    display={String(customHours)}
                    onDecrement={() => setCustomHours((h) => Math.max(0, h - 1))}
                    onIncrement={() => setCustomHours((h) => Math.min(23, h + 1))}
                  />
                  <Spinner
                    label="Minutos"
                    value={customMinutes}
                    display={String(customMinutes)}
                    onDecrement={() => setCustomMinutes((m) => Math.max(0, m - 5))}
                    onIncrement={() => setCustomMinutes((m) => Math.min(55, m + 5))}
                  />
                </View>

                <Pressable
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: theme.primary },
                    customHours === 0 && customMinutes === 0 && styles.confirmBtnDisabled,
                  ]}
                  onPress={handleCustomToday}
                  disabled={customHours === 0 && customMinutes === 0}
                >
                  <Text style={styles.confirmBtnText}>Adiar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.section}>
                <Calendar
                  minDate={tomorrowString()}
                  onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                  markedDates={{ [selectedDate]: { selected: true, selectedColor: colors.primary } }}
                  theme={calendarTheme}
                />

                <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: spacing.md }]}>Horário</Text>
                <View style={styles.spinners}>
                  <Spinner
                    label="Horas"
                    value={futureHour}
                    display={String(futureHour).padStart(2, "0")}
                    onDecrement={() => setFutureHour((h) => Math.max(0, h - 1))}
                    onIncrement={() => setFutureHour((h) => Math.min(23, h + 1))}
                  />
                  <Spinner
                    label="Minutos"
                    value={futureMinute}
                    display={String(futureMinute).padStart(2, "0")}
                    onDecrement={() => setFutureMinute((m) => Math.max(0, m - 5))}
                    onIncrement={() => setFutureMinute((m) => Math.min(55, m + 5))}
                  />
                </View>

                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
                  onPress={handleFutureConfirm}
                >
                  <Text style={styles.confirmBtnText}>Adiar para este dia</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.title,
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  presetText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  spinners: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  spinnerGroup: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  spinnerLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  spinner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    width: "100%",
  },
  spinnerBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  spinnerBtnText: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  spinnerValue: {
    fontFamily: fonts.title,
    fontSize: 22,
    minWidth: 48,
    textAlign: "center",
  },
  confirmBtn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
});
