import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { api } from "../src/services/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { IconSymbol } from "../src/components/IconSymbol";
import { Button } from "../src/components/ui";

const ONBOARDING_KEY = "onboarding_completed_v1";

export async function checkOnboardingCompleted(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted() {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
  } catch {}
}

type Goal = { id: string; label: string; icon: string; prompt: string };
type AlarmPreference = "LEVE" | "IMPORTANTE" | "CRITICO";

const GOALS: Goal[] = [
  { id: "study", label: "Estudar mais", icon: "school-outline", prompt: "Criar rotina de estudos diários de manhã e à noite" },
  { id: "workout", label: "Me exercitar", icon: "run", prompt: "Criar rotina de treino físico 3x por semana" },
  { id: "sleep", label: "Dormir melhor", icon: "weather-night", prompt: "Criar rotina de sono com horários fixos para dormir e acordar" },
  { id: "work", label: "Ser mais produtivo", icon: "briefcase-outline", prompt: "Criar rotina de trabalho com blocos de foco e pausas" },
  { id: "health", label: "Cuidar da saúde", icon: "heart-pulse", prompt: "Criar rotina de saúde com hidratação, medicamentos e exercícios" },
  { id: "custom", label: "Rotina personalizada", icon: "tune-variant", prompt: "" }
];

const WAKE_TIMES = ["05:00", "06:00", "06:30", "07:00", "07:30", "08:00", "09:00", "10:00"];
const WORK_TIMES = ["07:00", "08:00", "09:00", "10:00", "13:00", "14:00", "Não trabalho"];

export default function OnboardingScreen() {
  const { theme } = useThemeMode();
  const { width } = useResponsive();
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [workTime, setWorkTime] = useState("09:00");
  const [alarmPref, setAlarmPref] = useState<AlarmPreference>("IMPORTANTE");
  const [isGenerating, setIsGenerating] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const TOTAL_STEPS = 5;

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      Animated.timing(progressAnim, {
        toValue: (step + 2) / TOTAL_STEPS,
        duration: 300,
        useNativeDriver: false
      }).start();
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (step > 0) {
      Animated.timing(progressAnim, {
        toValue: step / TOTAL_STEPS,
        duration: 300,
        useNativeDriver: false
      }).start();
      setStep((s) => s - 1);
    }
  }

  function toggleGoal(id: string) {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    try {
      setIsGenerating(true);
      const selectedGoalObjects = GOALS.filter((g) => selectedGoals.includes(g.id) && g.prompt);

      if (selectedGoalObjects.length > 0) {
        const prompt = selectedGoalObjects
          .map((g) => g.prompt)
          .join(". ") + `. Horário de acordar: ${wakeTime}. Horário de trabalho/estudo: ${workTime}.`;

        const today = new Date().toISOString().slice(0, 10);
        const response = await api.post("/ai/schedules/suggest", {
          prompt,
          startDate: today,
          timezone: "America/Sao_Paulo"
        });

        await markOnboardingCompleted();
        router.replace({
          pathname: "/ai-review",
          params: { suggestion: JSON.stringify(response.data.suggestion) }
        });
      } else {
        await markOnboardingCompleted();
        router.replace("/meu-dia");
      }
    } catch (e: any) {
      await markOnboardingCompleted();
      Alert.alert(
        "Quase lá!",
        "Não conseguimos gerar a rotina agora. Você pode criar uma depois em 'Criar com IA'.",
        [{ text: "Continuar", onPress: () => router.replace("/meu-dia") }]
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  const canGoNext = (): boolean => {
    if (step === 0) return selectedGoals.length > 0;
    return true;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Barra de progresso */}
      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: theme.primary, width: progressWidth }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0 — Objetivos */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: theme.primarySoft }]}>
              <IconSymbol name="flag-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text, fontSize: scaledFont(24, width) }]}>
              Qual é seu objetivo?
            </Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              Selecione um ou mais objetivos. A IA vai montar sua primeira rotina.
            </Text>
            <View style={styles.goalsGrid}>
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <Pressable
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      active && { backgroundColor: theme.primarySoft, borderColor: theme.primary }
                    ]}
                    onPress={() => toggleGoal(goal.id)}
                  >
                    <IconSymbol name={goal.icon as any} size={24} color={active ? theme.primary : theme.textMuted} />
                    <Text style={[
                      styles.goalLabel,
                      { color: active ? theme.primary : theme.text, fontSize: scaledFont(13, width) }
                    ]}>
                      {goal.label}
                    </Text>
                    {active && (
                      <View style={[styles.goalCheck, { backgroundColor: theme.primary }]}>
                        <IconSymbol name="check" size={12} color={colors.white} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 1 — Horário de acordar */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: "#FFF7ED" }]}>
              <IconSymbol name="weather-sunny" size={32} color={colors.warning} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text, fontSize: scaledFont(24, width) }]}>
              Que horas você acorda?
            </Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              Isso ajuda a IA a sugerir horários realistas para você.
            </Text>
            <View style={styles.optionsGrid}>
              {WAKE_TIMES.map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.optionChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    wakeTime === t && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setWakeTime(t)}
                >
                  <Text style={[
                    styles.optionChipText,
                    { color: wakeTime === t ? colors.white : theme.text, fontSize: scaledFont(15, width) }
                  ]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Step 2 — Horário de trabalho */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: colors.warningSoft }]}>
              <IconSymbol name="briefcase-outline" size={32} color={colors.warning} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text, fontSize: scaledFont(24, width) }]}>
              Que horas você trabalha ou estuda?
            </Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              A IA vai evitar colocar atividades pesadas durante seu horário de trabalho.
            </Text>
            <View style={styles.optionsGrid}>
              {WORK_TIMES.map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.optionChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    workTime === t && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setWorkTime(t)}
                >
                  <Text style={[
                    styles.optionChipText,
                    { color: workTime === t ? colors.white : theme.text, fontSize: scaledFont(15, width) }
                  ]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Step 3 — Preferência de alarme */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
              <IconSymbol name="bell-ring-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text, fontSize: scaledFont(24, width) }]}>
              Que tipo de alarme prefere?
            </Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              Você pode mudar isso para cada lembrete individualmente depois.
            </Text>
            {[
              { id: "LEVE" as AlarmPreference, label: "Leve", desc: "Notificação simples, sem interrupção.", icon: "bell-outline", color: colors.success },
              { id: "IMPORTANTE" as AlarmPreference, label: "Importante (recomendado)", desc: "Som + vibração. Bom para a maioria dos lembretes.", icon: "bell-ring-outline", color: theme.primary },
              { id: "CRITICO" as AlarmPreference, label: "Crítico", desc: "Persiste até você responder. Ideal para remédios ou compromissos urgentes.", icon: "bell-alert-outline", color: colors.danger }
            ].map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.alarmCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  alarmPref === opt.id && { borderColor: opt.color, backgroundColor: `${opt.color}10` }
                ]}
                onPress={() => setAlarmPref(opt.id)}
              >
                <View style={[styles.alarmIcon, { backgroundColor: `${opt.color}18` }]}>
                  <IconSymbol name={opt.icon as any} size={22} color={opt.color} />
                </View>
                <View style={styles.alarmBody}>
                  <Text style={[styles.alarmLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.alarmDesc, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                    {opt.desc}
                  </Text>
                </View>
                {alarmPref === opt.id && (
                  <IconSymbol name="check-circle" size={20} color={opt.color} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 4 — Resumo e geração */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: colors.accentSoft }]}>
              <IconSymbol name="auto-fix" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.stepTitle, { color: theme.text, fontSize: scaledFont(24, width) }]}>
              Pronto para começar!
            </Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              Veja o resumo da sua configuração. A IA vai montar sua primeira rotina personalizada.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {[
                { label: "Objetivos", value: selectedGoals.map((id) => GOALS.find((g) => g.id === id)?.label || "").filter(Boolean).join(", ") || "Não selecionado" },
                { label: "Acorda às", value: wakeTime },
                { label: "Trabalha às", value: workTime },
                { label: "Tipo de alarme", value: alarmPref }
              ].map((row) => (
                <View key={row.label} style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.summaryLabel, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.text, fontSize: scaledFont(13, width) }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <Button
              title={isGenerating ? "Gerando sua rotina..." : "Gerar minha rotina com IA"}
              icon="auto-fix"
              onPress={handleFinish}
              loading={isGenerating}
              fullWidth
            />
            <Pressable style={styles.skipBtn} onPress={async () => { await markOnboardingCompleted(); router.replace("/meu-dia"); }}>
              <Text style={[styles.skipText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                Pular e configurar depois
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Navegação */}
      {step < 4 && (
        <View style={[styles.nav, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {step > 0 ? (
            <Pressable
              style={[styles.navBack, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={goBack}
            >
              <IconSymbol name="arrow-left" size={18} color={theme.text} />
              <Text style={[styles.navBackText, { color: theme.text, fontSize: scaledFont(14, width) }]}>Voltar</Text>
            </Pressable>
          ) : <View />}

          <Button
            title="Próximo"
            onPress={goNext}
            disabled={!canGoNext()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  progressBar: { height: 4, width: "100%" },
  progressFill: { height: 4 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl
  },

  stepContent: { alignItems: "center", width: "100%" },
  stepIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  stepTitle: {
    fontFamily: fonts.title,
    textAlign: "center",
    marginBottom: spacing.sm
  },
  stepDesc: {
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing.xl,
    maxWidth: 340
  },

  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    width: "100%"
  },
  goalCard: {
    width: "47%",
    minHeight: 80,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
    position: "relative",
    ...shadow.soft
  },
  goalLabel: { fontFamily: fonts.bold, textAlign: "center" },
  goalCheck: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    width: "100%"
  },
  optionChip: {
    width: "30%",
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  optionChipText: { fontFamily: fonts.title },

  alarmCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
    width: "100%",
    ...shadow.soft
  },
  alarmIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  alarmBody: { flex: 1 },
  alarmLabel: { fontFamily: fonts.bold },
  alarmDesc: { fontFamily: fonts.regular, marginTop: 2, lineHeight: 17 },

  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.xl,
    width: "100%",
    ...shadow.soft
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1
  },
  summaryLabel: { fontFamily: fonts.medium },
  summaryValue: { fontFamily: fonts.bold },

  skipBtn: { marginTop: spacing.lg, padding: spacing.sm },
  skipText: { fontFamily: fonts.medium },

  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderTopWidth: 1
  },
  navBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1
  },
  navBackText: { fontFamily: fonts.bold }
});
