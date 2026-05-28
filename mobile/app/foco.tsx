import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../src/services/api";
import { createReminderLogRequest } from "../src/services/reminders";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { PageHeader } from "../src/components/PageHeader";
import { IconSymbol } from "../src/components/IconSymbol";
import { isReminderDone, isReminderSkipped, isReminderOverdue, formatOverdueLabel } from "../src/utils/reminderStatus";
import { formatTime } from "../src/utils/date";

type FocusMode = "POMODORO" | "LIVRE";

const POMODORO_SECONDS = 25 * 60;

type TaskOption = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  overdue: boolean;
};

export default function FocoScreen() {
  const { theme, isDark } = useThemeMode();
  const { width } = useResponsive();
  const params = useLocalSearchParams<{ reminderId?: string; title?: string; description?: string }>();

  const [mode, setMode] = useState<FocusMode>("POMODORO");
  const [totalSeconds, setTotalSeconds] = useState(POMODORO_SECONDS);
  const [remaining, setRemaining] = useState(POMODORO_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(45);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [selectedId, setSelectedId] = useState<string | undefined>(params.reminderId);
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>(params.title);
  const [selectedDescription, setSelectedDescription] = useState<string | undefined>(params.description);
  const [taskOptions, setTaskOptions] = useState<TaskOption[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskPickerVisible, setTaskPickerVisible] = useState(false);

  const elapsed = totalSeconds - remaining;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  useFocusEffect(useCallback(() => {
    loadTaskOptions();
  }, []));

  async function loadTaskOptions() {
    try {
      setIsLoadingTasks(true);
      const res = await api.get("/reminders/today");
      const reminders: any[] = res.data.reminders || [];
      const options: TaskOption[] = reminders
        .filter((r) => !isReminderDone(r) && !isReminderSkipped(r))
        .map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          startAt: r.startAt,
          overdue: isReminderOverdue(r)
        }));
      setTaskOptions(options);
    } catch {
      // silently ignore — task picker will just be empty
    } finally {
      setIsLoadingTasks(false);
    }
  }

  useEffect(() => {
    if (mode === "POMODORO") {
      setTotalSeconds(POMODORO_SECONDS);
      setRemaining(POMODORO_SECONDS);
    } else {
      const secs = customMinutes * 60;
      setTotalSeconds(secs);
      setRemaining(secs);
    }
    setIsRunning(false);
    setIsFinished(false);
  }, [mode, customMinutes]);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function handleFinish() {
    setIsRunning(false);
    setIsFinished(true);
    if (selectedId) {
      try {
        const result = await createReminderLogRequest(selectedId, {
          action: "DONE",
          note: `Concluído via Modo Foco (${mode === "POMODORO" ? "Pomodoro 25min" : `${customMinutes}min livre`}).`
        });

        if (result.queued) {
          Alert.alert("Foco concluido offline", "A conclusao sera sincronizada quando a internet voltar.", [
            { text: "Ver Meu Dia", onPress: () => router.replace("/meu-dia") },
            { text: "Fechar", onPress: () => router.back() }
          ]);
          return;
        }

        Alert.alert("Parabéns!", "Atividade concluída e registrada.", [
          { text: "Ver Meu Dia", onPress: () => router.replace("/meu-dia") },
          { text: "Fechar", onPress: () => router.back() }
        ]);
      } catch {
        Alert.alert("Erro", "Nao foi possivel registrar a conclusao.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    } else {
      Alert.alert("Foco concluído", "Bom trabalho! Continue assim.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }

  function handleAbandon() {
    Alert.alert(
      "Abandonar foco",
      "Deseja encerrar o modo foco sem registrar a conclusão?",
      [
        { text: "Continuar focado", style: "cancel" },
        {
          text: "Abandonar",
          style: "destructive",
          onPress: () => {
            setIsRunning(false);
            router.back();
          }
        }
      ]
    );
  }

  function handleSelectTask(task: TaskOption) {
    setSelectedId(task.id);
    setSelectedTitle(task.title);
    setSelectedDescription(task.description || undefined);
    setTaskPickerVisible(false);
  }

  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference * (1 - progress);

  const timerColor = isFinished
    ? colors.success
    : remaining < 60
    ? colors.danger
    : theme.primary;

  return (
    <ScreenLayout scroll={false}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title="Modo Foco"
            subtitle={selectedTitle || "Timer de foco"}
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.back()}
              >
                <IconSymbol name="arrow-left" size={16} color={theme.text} />
              </Pressable>
            }
          />

          {/* Seletor de modo */}
          {!isRunning && !isFinished && (
            <View style={[styles.modeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {(["POMODORO", "LIVRE"] as FocusMode[]).map((m) => (
                <Pressable
                  key={m}
                  style={[
                    styles.modeBtn,
                    mode === m && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[
                    styles.modeBtnText,
                    { color: mode === m ? colors.white : theme.textMuted, fontSize: scaledFont(13, width) }
                  ]}>
                    {m === "POMODORO" ? "Pomodoro 25min" : "Livre"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Duração livre */}
          {mode === "LIVRE" && !isRunning && !isFinished && (
            <View style={[styles.durationRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.durationLabel, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                Duração:
              </Text>
              {[15, 25, 45, 60, 90].map((min) => (
                <Pressable
                  key={min}
                  style={[
                    styles.durationChip,
                    { borderColor: theme.border },
                    customMinutes === min && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setCustomMinutes(min)}
                >
                  <Text style={[
                    styles.durationChipText,
                    { color: customMinutes === min ? colors.white : theme.textMuted, fontSize: scaledFont(12, width) }
                  ]}>
                    {min}min
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Seletor de tarefa */}
          {!isRunning && !isFinished && (
            <Pressable
              style={[styles.taskSelector, { backgroundColor: theme.surface, borderColor: selectedId ? theme.primary : theme.border }]}
              onPress={() => setTaskPickerVisible(true)}
            >
              <View style={styles.taskSelectorLeft}>
                <IconSymbol
                  name={selectedId ? "checkbox-marked-circle-outline" : "plus-circle-outline"}
                  size={20}
                  color={selectedId ? theme.primary : theme.textMuted}
                />
                <View style={styles.taskSelectorText}>
                  {selectedTitle ? (
                    <>
                      <Text style={[styles.taskSelectorLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                        Tarefa
                      </Text>
                      <Text style={[styles.taskSelectorTitle, { color: theme.text, fontSize: scaledFont(14, width) }]} numberOfLines={1}>
                        {selectedTitle}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.taskSelectorTitle, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
                      Selecionar tarefa (opcional)
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.taskSelectorRight}>
                {isLoadingTasks ? (
                  <ActivityIndicator size="small" color={theme.textMuted} />
                ) : (
                  <IconSymbol name="chevron-right" size={16} color={theme.textMuted} />
                )}
              </View>
            </Pressable>
          )}

          {/* Timer circular */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.timerInner, { backgroundColor: theme.surface, borderColor: isDark ? "#1E2D4A" : colors.border }]}>
                {/* SVG-like progress ring using borders */}
                <View style={[styles.timerRing, { borderColor: theme.border }]}>
                  <View style={[styles.timerProgress, {
                    borderColor: timerColor,
                    opacity: progress > 0 ? 1 : 0.2
                  }]} />
                </View>

                <View style={styles.timerContent}>
                  <Text style={[styles.timerTime, { color: timerColor, fontSize: scaledFont(52, width) }]}>
                    {formatTimer(remaining)}
                  </Text>
                  <Text style={[styles.timerLabel, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                    {isFinished ? "Concluído!" : isRunning ? "Em foco..." : "Pronto para começar"}
                  </Text>
                  {selectedTitle ? (
                    <Text style={[styles.timerTask, { color: theme.text, fontSize: scaledFont(14, width) }]} numberOfLines={1}>
                      {selectedTitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Botões de controle */}
          <View style={styles.controls}>
            {!isFinished ? (
              <>
                <Pressable
                  style={[
                    styles.controlBtn,
                    styles.controlBtnPrimary,
                    { backgroundColor: isRunning ? colors.warning : theme.primary }
                  ]}
                  onPress={() => setIsRunning((v) => !v)}
                >
                  <IconSymbol name={isRunning ? "pause" : "play"} size={24} color={colors.white} />
                  <Text style={[styles.controlBtnText, { fontSize: scaledFont(15, width) }]}>
                    {isRunning ? "Pausar" : "Iniciar"}
                  </Text>
                </Pressable>

                {isRunning && (
                  <Pressable
                    style={[styles.controlBtn, styles.controlBtnSuccess, { backgroundColor: colors.successSoft }]}
                    onPress={handleFinish}
                  >
                    <IconSymbol name="check" size={20} color={colors.success} />
                    <Text style={[styles.controlBtnTextGreen, { fontSize: scaledFont(15, width) }]}>
                      Finalizar
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={[styles.controlBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={handleAbandon}
                >
                  <IconSymbol name="close" size={20} color={theme.textMuted} />
                  <Text style={[styles.controlBtnTextMuted, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
                    Abandonar
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={[styles.controlBtn, styles.controlBtnPrimary, { backgroundColor: colors.success }]}
                  onPress={handleFinish}
                >
                  <IconSymbol name="check-decagram" size={24} color={colors.white} />
                  <Text style={[styles.controlBtnText, { fontSize: scaledFont(15, width) }]}>
                    Marcar como feito
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.controlBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                  onPress={() => router.back()}
                >
                  <Text style={[styles.controlBtnTextMuted, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
                    Fechar
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Dica */}
          {!isRunning && !isFinished && (
            <View style={[styles.tipBox, { backgroundColor: isDark ? "#111A2E" : "#EEF2FF", borderColor: isDark ? "#2D3F66" : "#C7D2FE" }]}>
              <IconSymbol name="lightbulb-on-outline" size={16} color="#4F46E5" />
              <Text style={[styles.tipText, { fontSize: scaledFont(12, width) }]}>
                {mode === "POMODORO"
                  ? "Pomodoro: 25 min de foco + 5 min de pausa. Repita 4 vezes e descanse 20 min."
                  : "Modo livre: escolha a duração ideal para sua tarefa e mantenha o foco até o timer acabar."}
              </Text>
            </View>
          )}

          {/* Modal seletor de tarefas */}
          <TaskPickerModal
            visible={taskPickerVisible}
            tasks={taskOptions}
            selectedId={selectedId}
            onSelect={handleSelectTask}
            onClose={() => setTaskPickerVisible(false)}
            isDark={isDark}
            theme={theme}
            width={width}
          />
        </View>
      )}
    </ScreenLayout>
  );
}

function TaskPickerModal({
  visible,
  tasks,
  selectedId,
  onSelect,
  onClose,
  isDark,
  theme,
  width
}: {
  visible: boolean;
  tasks: TaskOption[];
  selectedId?: string;
  onSelect: (task: TaskOption) => void;
  onClose: () => void;
  isDark: boolean;
  theme: any;
  width: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
              Selecionar tarefa
            </Text>
            <Pressable onPress={onClose} style={[styles.modalCloseBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <IconSymbol name="close" size={16} color={theme.textMuted} />
            </Pressable>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.modalEmpty}>
              <IconSymbol name="check-all" size={32} color={theme.textSoft} />
              <Text style={[styles.modalEmptyText, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
                Todas as atividades de hoje foram concluídas!
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={[
                    styles.taskItem,
                    { backgroundColor: theme.surface, borderColor: task.id === selectedId ? theme.primary : theme.border },
                    task.id === selectedId && { borderColor: theme.primary }
                  ]}
                  onPress={() => onSelect(task)}
                >
                  <View style={styles.taskItemLeft}>
                    <View style={[
                      styles.taskItemDot,
                      { backgroundColor: task.overdue ? colors.danger : theme.primary }
                    ]} />
                    <View style={styles.taskItemText}>
                      <Text style={[styles.taskItemTitle, { color: theme.text, fontSize: scaledFont(14, width) }]} numberOfLines={2}>
                        {task.title}
                      </Text>
                      <View style={styles.taskItemMeta}>
                        <IconSymbol name="clock-outline" size={12} color={theme.textSoft} />
                        <Text style={[styles.taskItemTime, { color: task.overdue ? colors.danger : theme.textMuted, fontSize: scaledFont(12, width) }]}>
                          {task.overdue ? formatOverdueLabel(task.startAt) : formatTime(task.startAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {task.id === selectedId && (
                    <IconSymbol name="check-circle" size={20} color={theme.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%" },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },

  modeRow: {
    flexDirection: "row",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.xs
  },
  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  modeBtnText: { fontFamily: fonts.bold },

  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm
  },
  durationLabel: { fontFamily: fonts.medium },
  durationChip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  durationChipText: { fontFamily: fonts.bold },

  taskSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  taskSelectorLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.sm },
  taskSelectorRight: {},
  taskSelectorText: { flex: 1 },
  taskSelectorLabel: { fontFamily: fonts.medium, marginBottom: 2 },
  taskSelectorTitle: { fontFamily: fonts.bold },

  timerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl
  },
  timerOuter: {
    width: 240,
    height: 240
  },
  timerInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadow.medium
  },
  timerRing: {
    position: "absolute",
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 4
  },
  timerProgress: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 112,
    borderWidth: 4,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent"
  },
  timerContent: {
    alignItems: "center",
    gap: spacing.xs
  },
  timerTime: { fontFamily: fonts.title },
  timerLabel: { fontFamily: fonts.medium },
  timerTask: { fontFamily: fonts.bold, maxWidth: 180, textAlign: "center" },

  controls: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg
  },
  controlBtnPrimary: {},
  controlBtnSuccess: {},
  controlBtnText: { fontFamily: fonts.bold, color: colors.white },
  controlBtnTextGreen: { fontFamily: fonts.bold, color: colors.success },
  controlBtnTextMuted: { fontFamily: fonts.bold },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  tipText: {
    fontFamily: fonts.regular,
    color: "#4F46E5",
    flex: 1,
    lineHeight: 18
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "75%"
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md
  },
  modalTitle: { fontFamily: fonts.title },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  modalEmpty: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  modalEmptyText: { fontFamily: fonts.medium, textAlign: "center" },
  modalList: { flex: 1 },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm
  },
  taskItemLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: spacing.sm },
  taskItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5
  },
  taskItemText: { flex: 1 },
  taskItemTitle: { fontFamily: fonts.bold, marginBottom: 4 },
  taskItemMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  taskItemTime: { fontFamily: fonts.medium }
});
