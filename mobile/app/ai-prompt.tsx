import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../src/services/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { Button, Card, Input } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { AiBadge, AiPanel } from "../src/components/AiVisual";
import { IconSymbol } from "../src/components/IconSymbol";
import { useResponsive } from "../src/hooks/useResponsive";
import { useThemeMode } from "../src/context/ThemeContext";

const PROMPT_PLACEHOLDER =
  "Ex: crie uma rotina para estudar ingles todos os dias as 20:00 por 5 dias, com 30 minutos de estudo e revisao de vocabulario.";

function getParamString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export default function AiPromptScreen() {
  const { width, isPhone, isSmallPhone, gap } = useResponsive();
  const { theme } = useThemeMode();
  const params = useLocalSearchParams<{
    prefillPrompt?: string | string[];
  }>();
  const prefillPrompt = useMemo(
    () => getParamString(params.prefillPrompt).trim(),
    [params.prefillPrompt]
  );
  const [prompt, setPrompt] = useState(prefillPrompt);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function formatDateDisplay(dateStr: string) {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }

  const isMobile = isPhone || isSmallPhone;

  useEffect(() => {
    setPrompt(prefillPrompt);
  }, [prefillPrompt]);

  async function handleGenerate() {
    try {
      if (!prompt.trim()) {
        Alert.alert("Atencao", "Digite o que voce quer organizar.");
        return;
      }

      setIsSubmitting(true);
      const response = await api.post("/ai/schedules/suggest", {
        prompt: prompt.trim(),
        startDate,
        timezone: "America/Sao_Paulo"
      });

      router.push({ pathname: "/ai-review", params: { suggestion: JSON.stringify(response.data.suggestion) } });
    } catch (error: any) {
      console.log("[AI PROMPT ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel gerar o cronograma com IA.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader
            title="Criar com IA"
            subtitle="Transforme texto em cronograma"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable 
                onPress={() => router.back()} 
                style={[
                  styles.backButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSmallPhone && styles.backButtonSmall
                ]}
              >
                <IconSymbol name="arrow-left" size={16} color={theme.text} />
                <Text style={[styles.backText, { color: theme.text, fontSize: scaledFont(13, width) }]}>Voltar</Text>
              </Pressable>
            }
          />

          <AiPanel
            eyebrow="PROMPT BUILDER"
            title="Descreva sua rotina. A IA monta os alarmes."
            description="Voce revisa tudo antes de salvar. Para saude e remedios, confirme sempre com a receita ou orientacao medica."
            icon="auto-fix"
            metric="AI"
            metricLabel="scheduler"
            tone="cyan"
            compact={isMobile}
            style={styles.heroPanel}
          >
            <View style={styles.heroBadges}>
              <AiBadge label="texto para cronograma" tone="cyan" />
              <AiBadge label="revisao antes de salvar" tone="green" />
            </View>
          </AiPanel>

          {/* Form Card */}
          <Card style={[styles.formCard, isMobile && styles.formCardMobile]}>
            <Input
              label="O que voce quer organizar?"
              placeholder={PROMPT_PLACEHOLDER}
              multiline
              value={prompt}
              onChangeText={setPrompt}
              size={isMobile ? "md" : "lg"}
            />

            {/* Date picker field */}
            <View style={styles.dateWrapper}>
              <Text style={[styles.dateLabel, { color: theme.text, fontSize: scaledFont(13, width) }]}>
                Data inicial
              </Text>
              <Pressable
                style={[styles.dateField, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                onPress={() => setShowCalendar(true)}
              >
                <View style={[styles.dateIconBox, { backgroundColor: theme.primarySoft }]}>
                  <IconSymbol name="calendar" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.dateFieldText, { color: theme.text, fontSize: scaledFont(15, width) }]}>
                  {formatDateDisplay(startDate)}
                </Text>
                <IconSymbol name="chevron-down" size={16} color={theme.textMuted} />
              </Pressable>
            </View>

            <Button
              title="Gerar cronograma"
              icon="auto-fix"
              onPress={handleGenerate}
              loading={isSubmitting}
              size={isMobile ? "md" : "lg"}
              fullWidth
            />
          </Card>

          {/* Calendar modal */}
          <Modal
            visible={showCalendar}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCalendar(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
              <Pressable style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarTitle, { color: theme.text, fontSize: scaledFont(15, width) }]}>
                    Selecionar data inicial
                  </Text>
                  <Pressable onPress={() => setShowCalendar(false)}>
                    <IconSymbol name="close" size={20} color={theme.textMuted} />
                  </Pressable>
                </View>
                <Calendar
                  current={startDate}
                  onDayPress={(day) => {
                    setStartDate(day.dateString);
                    setShowCalendar(false);
                  }}
                  markedDates={{
                    [startDate]: { selected: true, selectedColor: theme.primary }
                  }}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: theme.textMuted,
                    selectedDayBackgroundColor: theme.primary,
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: theme.primary,
                    dayTextColor: theme.text,
                    textDisabledColor: theme.textSoft,
                    arrowColor: theme.primary,
                    monthTextColor: theme.text,
                    textDayFontFamily: fonts.regular,
                    textMonthFontFamily: fonts.bold,
                    textDayHeaderFontFamily: fonts.medium,
                  }}
                />
              </Pressable>
            </Pressable>
          </Modal>

          {/* Examples Section */}
          <View style={styles.examples}>
            <Text style={[styles.examplesTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>Exemplos rapidos</Text>
            
            <View style={[styles.examplesGrid, { gap }]}>
              {[
                "Tomar remedio de 8 em 8 horas por 3 dias, comecando as 08:00.",
                "Estudar ingles de segunda a sexta as 20:00 por 30 minutos.",
                "Treinar segunda, quarta e sexta as 18:30 por 4 semanas."
              ].map((example, index) => (
                <Pressable 
                  key={example} 
                  style={[
                    styles.example,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isMobile && styles.exampleMobile
                  ]}
                  onPress={() => setPrompt(example)}
                >
                  <View style={[styles.exampleIconBox, { backgroundColor: theme.primarySoft }]}>
                    <IconSymbol name="lightbulb-on-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={[styles.exampleText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>{example}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { 
    height: 40, 
    paddingHorizontal: spacing.md, 
    borderRadius: radius.md, 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: "center", 
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  backButtonSmall: {
    height: 36,
    paddingHorizontal: spacing.sm
  },
  
  backText: { 
    color: colors.text, 
    fontFamily: fonts.bold 
  },
  heroPanel: {
    marginBottom: spacing.lg
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  
  hero: { 
    backgroundColor: "#0B1220", 
    borderRadius: radius.xl, 
    padding: spacing.xl, 
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(79, 124, 255, 0.15)"
  },
  heroMobile: {
    padding: spacing.lg,
    borderRadius: radius.lg
  },
  
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(79, 124, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(79, 124, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  heroIconBoxMobile: {
    width: 48,
    height: 48,
    borderRadius: 14
  },
  
  heroIcon: { 
    color: "#60A5FA",
    fontFamily: fonts.title
  },
  
  heroTitle: { 
    color: colors.white, 
    lineHeight: 30, 
    fontFamily: fonts.title 
  },
  
  heroText: { 
    color: "#94A3B8", 
    lineHeight: 20, 
    marginTop: spacing.sm,
    fontFamily: fonts.regular
  },
  
  formCard: {
    marginBottom: spacing.xl
  },
  formCardMobile: {
    padding: spacing.md
  },

  dateWrapper: {
    marginBottom: spacing.md
  },
  dateLabel: {
    fontFamily: fonts.bold,
    marginBottom: spacing.sm
  },
  dateField: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm
  },
  dateIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  dateFieldText: {
    flex: 1,
    fontFamily: fonts.regular
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg
  },
  calendarCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    ...shadow.glow
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md
  },
  calendarTitle: {
    fontFamily: fonts.bold
  },
  
  examples: { 
    marginTop: spacing.md 
  },
  
  examplesTitle: { 
    color: colors.text, 
    fontFamily: fonts.title, 
    marginBottom: spacing.md 
  },
  
  examplesGrid: {
    flexDirection: "column"
  },
  
  example: { 
    backgroundColor: colors.surface, 
    borderRadius: radius.lg, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    ...shadow.soft
  },
  exampleMobile: {
    padding: spacing.sm
  },
  
  exampleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  
  exampleIcon: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 14
  },
  
  exampleText: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium, 
    lineHeight: 19,
    flex: 1
  }
});
