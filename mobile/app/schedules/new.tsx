import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "../../src/services/api";
import { colors, fonts, getCategoryMeta, radius, shadow, spacing } from "../../src/theme";
import { Button, Card, Input, SectionTitle } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";

type Category = "HEALTH" | "STUDY" | "WORKOUT" | "WORK" | "SLEEP" | "WATER" | "PERSONAL" | "OTHER";
type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

const categories: Category[] = ["HEALTH", "STUDY", "WORKOUT", "WORK", "SLEEP", "WATER", "PERSONAL", "OTHER"];

function parseLinks(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export default function NewScheduleScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [linksText, setLinksText] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [category, setCategory] = useState<Category>("STUDY");
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const [reminderBeforeMinutes, setReminderBeforeMinutes] = useState("10");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryMeta = useMemo(() => getCategoryMeta(category), [category]);

  async function handleCreate() {
    try {
      if (!title.trim()) {
        Alert.alert("Atenção", "Informe um título para o cronograma.");
        return;
      }

      setIsSubmitting(true);

      await api.post("/schedules", {
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        links: parseLinks(linksText),
        extraInfo: extraInfo.trim() || undefined,
        category,
        sourceType: "MANUAL"
      });

      Alert.alert("Cronograma criado", "Agora você pode adicionar lembretes a esta rotina.");
      router.replace("/schedules");
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
        <View>
          <PageHeader
            title="Novo cronograma"
            subtitle="Monte uma rotina manual com contexto e automação"
            onMenu={isWide ? undefined : openMenu}
            right={<Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Voltar</Text></Pressable>}
          />

          <View style={styles.grid}>
            <View style={styles.formColumn}>
              <Card style={styles.sectionCard}>
                <SectionTitle title="1. Informações básicas" subtitle="Quanto mais contexto, melhor será a organização da sua rotina." />
                <Input label="Título" placeholder="Ex: Estudar para o ENEM" value={title} onChangeText={setTitle} hint={`${title.length}/80`} />
                <Input label="Descrição" placeholder="Em poucas palavras, qual o objetivo deste cronograma?" value={description} onChangeText={setDescription} multiline hint={`${description.length}/120`} />
                <Input label="Observações" placeholder="Detalhes importantes, contexto ou instruções específicas." value={notes} onChangeText={setNotes} multiline hint={`${notes.length}/300`} />
                <Input label="Links úteis" placeholder={"Cole links relevantes, um por linha\nhttps://exemplo.com"} value={linksText} onChangeText={setLinksText} multiline autoCapitalize="none" hint="Artigos, docs, vídeos, receitas ou materiais de referência." />
                <Input label="Informações extras" placeholder="Qualquer outra informação que a IA deve considerar ao gerar sua rotina." value={extraInfo} onChangeText={setExtraInfo} multiline hint={`${extraInfo.length}/400`} />
              </Card>

              <Card style={styles.sectionCard}>
                <SectionTitle title="2. Categoria" subtitle="Escolha a categoria que melhor representa este cronograma." />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                  {categories.map((item) => {
                    const meta = getCategoryMeta(item);
                    const active = category === item;
                    return (
                      <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryPill, active && { borderColor: meta.color, backgroundColor: meta.background }]}>
                        <Text style={[styles.categoryText, active && { color: meta.color }]}>{meta.icon} {meta.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Card>

              <Card style={styles.sectionCard}>
                <SectionTitle title="3. Notificações e prioridade" subtitle="Configure como essa rotina deve se comportar no app." />
                <View style={styles.settingGrid}>
                  <Pressable style={styles.settingBox} onPress={() => setAlarmsEnabled((current) => !current)}>
                    <Text style={styles.settingTitle}>◔ Ativar alarmes</Text>
                    <Text style={styles.settingText}>{alarmsEnabled ? "Ativado" : "Desativado"}</Text>
                  </Pressable>
                  <Pressable style={styles.settingBox} onPress={() => setReminderBeforeMinutes((current) => current === "10" ? "30" : "10")}>
                    <Text style={styles.settingTitle}>◷ Lembrete antes</Text>
                    <Text style={styles.settingText}>{reminderBeforeMinutes} minutos</Text>
                  </Pressable>
                  <Pressable style={styles.settingBox} onPress={() => setPriority((current) => current === "NORMAL" ? "HIGH" : current === "HIGH" ? "CRITICAL" : "NORMAL")}>
                    <Text style={styles.settingTitle}>⚑ Prioridade</Text>
                    <Text style={styles.settingText}>{priority === "NORMAL" ? "Normal" : priority === "HIGH" ? "Alta" : "Crítica"}</Text>
                  </Pressable>
                </View>
              </Card>

              <View style={styles.footerActions}>
                <Button title="Limpar" variant="secondary" onPress={() => { setTitle(""); setDescription(""); setNotes(""); setLinksText(""); setExtraInfo(""); }} style={styles.footerButton} />
                <Button title="Salvar cronograma" onPress={handleCreate} loading={isSubmitting} style={styles.footerButton} />
              </View>
            </View>

            <View style={styles.previewColumn}>
              <Card style={styles.previewCard}>
                <SectionTitle title="Preview do cronograma" subtitle="Veja como sua rotina será organizada." />
                <View style={styles.previewHeader}>
                  <View style={[styles.previewIcon, { backgroundColor: categoryMeta.background }]}>
                    <Text style={[styles.previewIconText, { color: categoryMeta.color }]}>{categoryMeta.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitle}>{title || "Seu novo cronograma"}</Text>
                    <Text style={styles.previewDescription}>{description || "Rotina com contexto, lembretes e organização inteligente."}</Text>
                  </View>
                </View>
                <View style={styles.previewRows}>
                  <View style={styles.previewRow}><Text style={styles.previewLabel}>Categoria</Text><Text style={styles.previewValue}>{categoryMeta.label}</Text></View>
                  <View style={styles.previewRow}><Text style={styles.previewLabel}>Alarmes</Text><Text style={styles.previewValue}>{alarmsEnabled ? "Ativados" : "Desativados"}</Text></View>
                  <View style={styles.previewRow}><Text style={styles.previewLabel}>Lembrete antes</Text><Text style={styles.previewValue}>{reminderBeforeMinutes} min</Text></View>
                  <View style={styles.previewRow}><Text style={styles.previewLabel}>Prioridade</Text><Text style={styles.previewValue}>{priority}</Text></View>
                </View>
              </Card>

              <Card style={styles.aiCard}>
                <Text style={styles.aiTitle}>Assistente de Rotina AI ✦</Text>
                <Text style={styles.aiText}>Com base nas informações fornecidas, a IA poderá sugerir horários ideais, revisões e alertas mais precisos.</Text>
                <Button title="Gerar cronograma com IA" variant="ai" onPress={() => router.push("/ai-prompt")} style={{ marginTop: spacing.lg }} />
              </Card>
            </View>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontFamily: fonts.bold },
  grid: { flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" },
  formColumn: { flex: 1.7 },
  previewColumn: { flex: 0.85, gap: spacing.lg },
  sectionCard: { marginBottom: spacing.lg },
  categoryRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  categoryPill: { height: 42, borderRadius: radius.pill, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  categoryText: { color: colors.textMuted, fontFamily: fonts.bold },
  settingGrid: { flexDirection: "row", gap: spacing.md },
  settingBox: { flex: 1, minHeight: 86, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, padding: spacing.lg, justifyContent: "center" },
  settingTitle: { color: colors.text, fontFamily: fonts.bold, marginBottom: spacing.xs },
  settingText: { color: colors.textMuted, fontFamily: fonts.medium },
  footerActions: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xxxl },
  footerButton: { flex: 1 },
  previewCard: { padding: spacing.xl },
  previewHeader: { flexDirection: "row", gap: spacing.md, alignItems: "center", paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewIcon: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  previewIconText: { fontFamily: fonts.title, fontSize: 26 },
  previewTitle: { color: colors.text, fontFamily: fonts.title, fontSize: 18 },
  previewDescription: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 20, marginTop: spacing.xs },
  previewRows: { marginTop: spacing.lg, gap: spacing.md },
  previewRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  previewLabel: { color: colors.textMuted, fontFamily: fonts.medium },
  previewValue: { color: colors.text, fontFamily: fonts.bold },
  aiCard: { borderColor: "#DDD6FE" },
  aiTitle: { color: colors.accent, fontFamily: fonts.title, fontSize: 18 },
  aiText: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 21, marginTop: spacing.sm }
});
