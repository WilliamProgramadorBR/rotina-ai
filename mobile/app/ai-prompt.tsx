import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "../src/services/api";
import { colors, spacing } from "../src/theme";
import { Button, Card, Input } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";

export default function AiPromptScreen() {
  const [prompt, setPrompt] = useState("Crie uma rotina para eu estudar inglês todos os dias às 20:00 durante 5 dias. Cada lembrete deve dizer: estudar inglês por 30 minutos e revisar vocabulário.");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGenerate() {
    try {
      if (!prompt.trim()) {
        Alert.alert("Atenção", "Digite o que você quer organizar.");
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
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível gerar o cronograma com IA.");
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
            right={<Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></Pressable>}
          />

          <View style={styles.hero}>
            <Text style={styles.heroIcon}>✨</Text>
            <Text style={styles.heroTitle}>Descreva sua rotina. A IA monta os alarmes.</Text>
            <Text style={styles.heroText}>Você poderá revisar tudo antes de salvar. Para saúde e remédios, confirme sempre com a receita/orientação médica.</Text>
          </View>

          <Card>
            <Input label="O que você quer organizar?" placeholder="Ex: tomar remédio de 8 em 8 horas por 3 dias..." multiline value={prompt} onChangeText={setPrompt} />
            <Input label="Data inicial" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
            <Button title="Gerar cronograma" onPress={handleGenerate} loading={isSubmitting} />
          </Card>

          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>Exemplos rápidos</Text>
            {[
              "Tomar remédio de 8 em 8 horas por 3 dias, começando às 08:00.",
              "Estudar inglês de segunda a sexta às 20:00 por 30 minutos.",
              "Treinar segunda, quarta e sexta às 18:30 por 4 semanas."
            ].map((example) => (
              <Pressable key={example} style={styles.example} onPress={() => setPrompt(example)}>
                <Text style={styles.exampleText}>{example}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontWeight: "900" },
  hero: { backgroundColor: colors.dark, borderRadius: 30, padding: spacing.xl, marginBottom: spacing.lg },
  heroIcon: { fontSize: 34, marginBottom: spacing.md },
  heroTitle: { color: colors.white, fontSize: 26, lineHeight: 32, fontWeight: "900" },
  heroText: { color: "#CBD5E1", fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  examples: { marginTop: spacing.xl },
  examplesTitle: { color: colors.text, fontSize: 18, fontWeight: "900", marginBottom: spacing.md },
  example: { backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.sm },
  exampleText: { color: colors.textMuted, fontWeight: "800", lineHeight: 20 }
});
