import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { getApiErrorMessage } from "@/services/api";
import { createScheduleRequest } from "@/services/schedules";
import { ScheduleCategory } from "@/types/api";

const CATEGORIES: { value: ScheduleCategory; label: string }[] = [
  { value: "HEALTH", label: "Saúde" },
  { value: "STUDY", label: "Estudo" },
  { value: "WORKOUT", label: "Treino" },
  { value: "WORK", label: "Trabalho" },
  { value: "SLEEP", label: "Sono" },
  { value: "WATER", label: "Água" },
  { value: "PERSONAL", label: "Pessoal" },
  { value: "OTHER", label: "Outro" },
];

export default function NewScheduleScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ScheduleCategory>("OTHER");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    try {
      if (!title.trim()) {
        Alert.alert("Atenção", "Informe um título para o cronograma.");
        return;
      }

      setLoading(true);
      const schedule = await createScheduleRequest({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        sourceType: "MANUAL",
      });

      router.replace(`/schedules/${schedule.id}`);
    } catch (error) {
      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>← Voltar</Text>
        <Text style={styles.title}>Novo cronograma</Text>
        <Text style={styles.subtitle}>Crie um grupo para organizar seus lembretes.</Text>
      </View>

      <View style={styles.form}>
        <Input label="Título" value={title} onChangeText={setTitle} placeholder="Ex: Tratamento médico" />
        <Input
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Remédios desta semana"
          multiline
          style={styles.textarea}
        />

        <View style={styles.categoryWrapper}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((item) => {
              const selected = item.value === category;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setCategory(item.value)}
                  style={[styles.categoryItem, selected && styles.categoryItemSelected]}
                >
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button title="Salvar cronograma" onPress={handleCreate} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 24,
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
  form: {
    gap: 16,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  categoryWrapper: {
    gap: 10,
  },
  label: {
    color: "#CBD5E1",
    fontWeight: "700",
    fontSize: 14,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryItem: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
  },
  categoryItemSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryText: {
    color: "#CBD5E1",
    fontWeight: "800",
  },
  categoryTextSelected: {
    color: "#052E16",
  },
});
