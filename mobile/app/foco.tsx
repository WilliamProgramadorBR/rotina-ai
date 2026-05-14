import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { createReminderLogRequest } from "../src/services/reminders";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { PageHeader } from "../src/components/PageHeader";
import { IconSymbol } from "../src/components/IconSymbol";

type FocusMode = "POMODORO" | "LIVRE";

const POMODORO_SECONDS = 25 * 60;

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

  const elapsed = totalSeconds - remaining;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

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
    if (params.reminderId) {
      try {
        const result = await createReminderLogRequest(params.reminderId, {
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
            subtitle={params.title || "Timer de foco"}
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
                  {params.title ? (
                    <Text style={[styles.timerTask, { color: theme.text, fontSize: scaledFont(14, width) }]} numberOfLines={1}>
                      {params.title}
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
        </View>
      )}
    </ScreenLayout>
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
  }
});
