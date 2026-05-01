import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/services/api";
import { ScheduleCategory } from "../../src/types/entities";
import { colors, getCategoryMeta, spacing } from "../../src/theme";
import { Button, Card, Input } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";

const categories: ScheduleCategory[] = ["HEALTH", "STUDY", "WORKOUT", "WORK", "SLEEP", "WATER", "PERSONAL", "OTHER"];

export default function NewScheduleScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ScheduleCategory>("OTHER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate() {
    try {
      if (!title.trim()) {
        Alert.alert("Atenção", "Informe um título para o cronograma.");
        return;
      }

      setIsSubmitting(true);
      const response = await api.post("/schedules", {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        sourceType: "MANUAL"
      });

      router.replace(`/schedules/${response.data.schedule.id}` as any);
    } catch (error: any) {
      console.log("[CREATE SCHEDULE ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível criar o cronograma.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader title="Novo cronograma" subtitle="Crie uma rotina manual" onMenu={isWide ? undefined : openMenu} right={<Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></Pressable>} />

          <Card>
            <Input label="Título" placeholder="Ex: Tratamento médico" value={title} onChangeText={setTitle} />
            <Input label="Descrição" placeholder="Explique o objetivo deste cronograma..." value={description} onChangeText={setDescription} multiline />

            <Text style={styles.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
              {categories.map((item) => {
                const meta = getCategoryMeta(item);
                const active = category === item;
                return (
                  <Pressable key={item} onPress={() => setCategory(item)} style={[styles.category, { backgroundColor: active ? meta.color : meta.soft, borderColor: active ? meta.color : colors.border }]}>
                    <Text style={styles.categoryIcon}>{meta.icon}</Text>
                    <Text style={[styles.categoryText, { color: active ? colors.white : meta.color }]}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Button title="Criar cronograma" onPress={handleCreate} loading={isSubmitting} style={{ marginTop: spacing.lg }} />
          </Card>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontWeight: "900" },
  label: { color: colors.text, fontSize: 14, fontWeight: "900", marginBottom: spacing.sm },
  categories: { gap: spacing.sm, paddingBottom: spacing.xs },
  category: { minHeight: 42, borderRadius: 999, borderWidth: 1, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  categoryIcon: { fontSize: 16 },
  categoryText: { fontWeight: "900" }
});
