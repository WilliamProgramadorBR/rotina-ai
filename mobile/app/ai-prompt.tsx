import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { api } from "../src/services/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { Button, Card, Input } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { useResponsive } from "../src/hooks/useResponsive";

export default function AiPromptScreen() {
  const { width, isPhone, isSmallPhone, gap } = useResponsive();
  const [prompt, setPrompt] = useState("Crie uma rotina para eu estudar ingles todos os dias as 20:00 durante 5 dias. Cada lembrete deve dizer: estudar ingles por 30 minutos e revisar vocabulario.");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = isPhone || isSmallPhone;

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
                style={[styles.backButton, isSmallPhone && styles.backButtonSmall]}
              >
                <Text style={[styles.backText, { fontSize: scaledFont(13, width) }]}>Voltar</Text>
              </Pressable>
            }
          />

          {/* Hero Section */}
          <View style={[styles.hero, isMobile && styles.heroMobile]}>
            <View style={[styles.heroIconBox, isMobile && styles.heroIconBoxMobile]}>
              <Text style={[styles.heroIcon, { fontSize: scaledFont(isMobile ? 22 : 28, width) }]}>AI</Text>
            </View>
            <Text style={[styles.heroTitle, { fontSize: scaledFont(isMobile ? 20 : 24, width) }]}>
              Descreva sua rotina. A IA monta os alarmes.
            </Text>
            <Text style={[styles.heroText, { fontSize: scaledFont(13, width) }]}>
              Voce podera revisar tudo antes de salvar. Para saude e remedios, confirme sempre com a receita/orientacao medica.
            </Text>
          </View>

          {/* Form Card */}
          <Card style={[styles.formCard, isMobile && styles.formCardMobile]}>
            <Input 
              label="O que voce quer organizar?" 
              placeholder="Ex: tomar remedio de 8 em 8 horas por 3 dias..." 
              multiline 
              value={prompt} 
              onChangeText={setPrompt}
              size={isMobile ? "md" : "lg"}
            />
            <Input 
              label="Data inicial" 
              placeholder="YYYY-MM-DD" 
              value={startDate} 
              onChangeText={setStartDate}
              size={isMobile ? "md" : "lg"}
            />
            <Button 
              title="Gerar cronograma" 
              onPress={handleGenerate} 
              loading={isSubmitting}
              size={isMobile ? "md" : "lg"}
              fullWidth
            />
          </Card>

          {/* Examples Section */}
          <View style={styles.examples}>
            <Text style={[styles.examplesTitle, { fontSize: scaledFont(16, width) }]}>Exemplos rapidos</Text>
            
            <View style={[styles.examplesGrid, { gap }]}>
              {[
                "Tomar remedio de 8 em 8 horas por 3 dias, comecando as 08:00.",
                "Estudar ingles de segunda a sexta as 20:00 por 30 minutos.",
                "Treinar segunda, quarta e sexta as 18:30 por 4 semanas."
              ].map((example, index) => (
                <Pressable 
                  key={example} 
                  style={[styles.example, isMobile && styles.exampleMobile]}
                  onPress={() => setPrompt(example)}
                >
                  <View style={styles.exampleIconBox}>
                    <Text style={styles.exampleIcon}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.exampleText, { fontSize: scaledFont(13, width) }]}>{example}</Text>
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
    justifyContent: "center" 
  },
  backButtonSmall: {
    height: 36,
    paddingHorizontal: spacing.sm
  },
  
  backText: { 
    color: colors.text, 
    fontFamily: fonts.bold 
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
