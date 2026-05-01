import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";

export default function AiPromptScreen() {
  const [prompt, setPrompt] = useState("");

  function handleGenerate() {
    Alert.alert(
      "Próxima fase",
      "Nesta tela vamos conectar o endpoint de IA para transformar o prompt em cronogramas revisáveis."
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>← Voltar</Text>
        <Text style={styles.title}>Prompt IA</Text>
        <Text style={styles.subtitle}>
          Descreva sua rotina, receita, treino ou plano de estudos. A IA vai sugerir alarmes para você revisar antes de salvar.
        </Text>
      </View>

      <Card>
        <Text style={styles.warningTitle}>Fluxo seguro</Text>
        <Text style={styles.warningText}>
          A IA nunca deve ativar alarmes automaticamente. Primeiro ela sugere, depois você revisa e confirma.
        </Text>
      </Card>

      <View style={styles.form}>
        <Input
          label="Prompt"
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ex: Tenho que estudar inglês 40 minutos por dia e tomar remédio de 8 em 8 horas por 7 dias."
          multiline
          style={styles.textarea}
        />

        <Button title="Gerar sugestão" onPress={handleGenerate} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  back: {
    color: "#93C5FD",
    marginBottom: 12,
    fontWeight: "800",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  warningTitle: {
    color: "#FBBF24",
    fontSize: 16,
    fontWeight: "900",
  },
  warningText: {
    color: "#CBD5E1",
    lineHeight: 22,
  },
  form: {
    marginTop: 18,
    gap: 16,
  },
  textarea: {
    minHeight: 180,
    textAlignVertical: "top",
    paddingTop: 14,
  },
});
