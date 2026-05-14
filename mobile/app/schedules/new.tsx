import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { router } from "expo-router";
import { api } from "../../src/services/api";
import { colors, fonts, getCategoryMeta, radius, spacing } from "../../src/theme";
import { Button, Card, Input, SectionTitle } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useThemeMode } from "../../src/context/ThemeContext";
import { useResponsive } from "../../src/hooks/useResponsive";

type Category = "HEALTH" | "STUDY" | "WORKOUT" | "WORK" | "SLEEP" | "WATER" | "PERSONAL" | "OTHER";
type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

const categories: Category[] = ["HEALTH", "STUDY", "WORKOUT", "WORK", "SLEEP", "WATER", "PERSONAL", "OTHER"];

function parseLinks(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

// Componente de preview colapsavel para mobile
function PreviewSection({
  expanded,
  onToggle,
  categoryMeta,
  title,
  description,
  alarmsEnabled,
  reminderBeforeMinutes,
  priority
}: {
  expanded: boolean;
  onToggle: () => void;
  categoryMeta: ReturnType<typeof getCategoryMeta>;
  title: string;
  description: string;
  alarmsEnabled: boolean;
  reminderBeforeMinutes: string;
  priority: Priority;
}) {
  const { theme } = useThemeMode();

  return (
    <Card style={styles.previewCard}>
      <Pressable
        style={styles.previewHeader}
        onPress={onToggle}
        accessible
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.previewHeaderLeft}>
          <View style={[styles.previewIcon, { backgroundColor: categoryMeta.background }]}>
            <Text style={[styles.previewIconText, { color: categoryMeta.color }]}>
              {categoryMeta.icon}
            </Text>
          </View>
          <View style={styles.previewHeaderInfo}>
            <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={1}>
              {title || "Seu novo cronograma"}
            </Text>
            <Text style={[styles.previewSubtitle, { color: theme.textMuted }]}>
              Toque para {expanded ? "recolher" : "expandir"}
            </Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.previewContent}>
          <Text style={[styles.previewDescription, { color: theme.textMuted }]} numberOfLines={3}>
            {description || "Rotina com contexto, lembretes e organização inteligente."}
          </Text>

          <View style={[styles.previewDivider, { backgroundColor: theme.border }]} />

          <View style={styles.previewRows}>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Categoria</Text>
              <Text style={[styles.previewValue, { color: theme.text }]}>{categoryMeta.label}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Alarmes</Text>
              <Text style={[styles.previewValue, { color: theme.text }]}>{alarmsEnabled ? "Ativados" : "Desativados"}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Lembrete antes</Text>
              <Text style={[styles.previewValue, { color: theme.text }]}>{reminderBeforeMinutes} min</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Prioridade</Text>
              <Text style={[styles.previewValue, { color: theme.text }]}>
                {priority === "NORMAL" ? "Normal" : priority === "HIGH" ? "Alta" : priority === "CRITICAL" ? "Crítica" : "Baixa"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
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
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const categoryMeta = useMemo(() => getCategoryMeta(category), [category]);
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const { isPhone, isSmallPhone, isTablet, isDesktop } = useResponsive();

  // Layout em coluna unica para mobile (< 768px)
  const isMobileLayout = width < 768;

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

  function handleClear() {
    setTitle("");
    setDescription("");
    setNotes("");
    setLinksText("");
    setExtraInfo("");
  }

  function buildAiPromptFromDraft() {
    const parts = [
      "Crie um cronograma com IA usando as informacoes abaixo."
    ];

    if (title.trim()) parts.push(`Titulo: ${title.trim()}`);
    if (description.trim()) parts.push(`Descricao: ${description.trim()}`);
    if (notes.trim()) parts.push(`Observacoes: ${notes.trim()}`);
    if (linksText.trim()) parts.push(`Links uteis: ${linksText.trim()}`);
    if (extraInfo.trim()) parts.push(`Informacoes extras: ${extraInfo.trim()}`);

    parts.push(`Categoria: ${categoryMeta.label}`);
    parts.push(`Alarmes: ${alarmsEnabled ? "ativados" : "desativados"}`);
    parts.push(`Lembrete antes: ${reminderBeforeMinutes} minutos`);
    parts.push(`Prioridade: ${priority}`);
    parts.push("Gere lembretes claros, com horarios realistas e observacoes praticas.");

    return parts.join("\n");
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <PageHeader
            title="Novo cronograma"
            subtitle="Monte uma rotina manual com contexto"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.back()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
              </Pressable>
            }
          />

          {/* Preview colapsavel no mobile - aparece no topo */}
          {isMobileLayout && (
            <PreviewSection
              expanded={previewExpanded}
              onToggle={() => setPreviewExpanded(!previewExpanded)}
              categoryMeta={categoryMeta}
              title={title}
              description={description}
              alarmsEnabled={alarmsEnabled}
              reminderBeforeMinutes={reminderBeforeMinutes}
              priority={priority}
            />
          )}

          <View style={[styles.grid, isMobileLayout && styles.gridMobile]}>
            {/* Coluna do formulario */}
            <View style={[styles.formColumn, isMobileLayout && styles.formColumnMobile]}>

              {/* Secao 1 - Informacoes basicas */}
              <Card style={styles.sectionCard}>
                <SectionTitle
                  title="1. Informações básicas"
                  subtitle="Quanto mais contexto, melhor a organização."
                />

                <Input
                  label="Título"
                  placeholder="Ex: Estudar para o ENEM"
                  value={title}
                  onChangeText={setTitle}
                  hint={`${title.length}/80`}
                  maxLength={80}
                />

                <Input
                  label="Descrição"
                  placeholder="Qual o objetivo deste cronograma?"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  hint={`${description.length}/120`}
                  maxLength={120}
                  numberOfLines={3}
                />

                <Input
                  label="Observações"
                  placeholder="Detalhes importantes ou instruções específicas."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  hint={`${notes.length}/300`}
                  maxLength={300}
                  numberOfLines={4}
                />

                <Input
                  label="Links úteis"
                  placeholder={"Cole links relevantes, um por linha"}
                  value={linksText}
                  onChangeText={setLinksText}
                  multiline
                  autoCapitalize="none"
                  hint="Artigos, docs, vídeos ou materiais de referência."
                  numberOfLines={3}
                />

                <Input
                  label="Informações extras"
                  placeholder="Outras informações que a IA deve considerar."
                  value={extraInfo}
                  onChangeText={setExtraInfo}
                  multiline
                  hint={`${extraInfo.length}/400`}
                  maxLength={400}
                  numberOfLines={3}
                />
              </Card>

              {/* Secao 2 - Categoria */}
              <Card style={styles.sectionCard}>
                <SectionTitle
                  title="2. Categoria"
                  subtitle="Escolha a que melhor representa este cronograma."
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRow}
                >
                  {categories.map((item) => {
                    const meta = getCategoryMeta(item);
                    const active = category === item;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setCategory(item)}
                        style={[
                          styles.categoryPill,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                          active && { borderColor: meta.color, backgroundColor: meta.background }
                        ]}
                      >
                        <Text
                          style={[styles.categoryText, { color: theme.textMuted }, active && { color: meta.color }]}
                          numberOfLines={1}
                        >
                          {meta.icon} {meta.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Card>

              {/* Secao 3 - Notificacoes e prioridade */}
              <Card style={styles.sectionCard}>
                <SectionTitle
                  title="3. Notificações e prioridade"
                  subtitle="Configure o comportamento no app."
                />

                <View style={[styles.settingGrid, isMobileLayout && styles.settingGridMobile]}>
                  <Pressable
                    style={[styles.settingBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobileLayout && styles.settingBoxMobile]}
                    onPress={() => setAlarmsEnabled((current) => !current)}
                  >
                    <Text style={styles.settingIcon}>◔</Text>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: theme.text }]}>Ativar alarmes</Text>
                      <Text style={[styles.settingText, { color: theme.textMuted }]}>{alarmsEnabled ? "Ativado" : "Desativado"}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[styles.settingBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobileLayout && styles.settingBoxMobile]}
                    onPress={() => setReminderBeforeMinutes((current) => current === "10" ? "30" : "10")}
                  >
                    <Text style={styles.settingIcon}>◷</Text>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: theme.text }]}>Lembrete antes</Text>
                      <Text style={[styles.settingText, { color: theme.textMuted }]}>{reminderBeforeMinutes} minutos</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[styles.settingBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobileLayout && styles.settingBoxMobile]}
                    onPress={() => setPriority((current) => current === "NORMAL" ? "HIGH" : current === "HIGH" ? "CRITICAL" : "NORMAL")}
                  >
                    <Text style={styles.settingIcon}>⚑</Text>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingTitle, { color: theme.text }]}>Prioridade</Text>
                      <Text style={[styles.settingText, { color: theme.textMuted }]}>
                        {priority === "NORMAL" ? "Normal" : priority === "HIGH" ? "Alta" : "Crítica"}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </Card>

              {/* Botoes de acao */}
              <View style={[styles.footerActions, isMobileLayout && styles.footerActionsMobile]}>
                <Button
                  title="Limpar"
                  variant="secondary"
                  onPress={handleClear}
                  style={[styles.footerButton, isMobileLayout && styles.footerButtonMobile]}
                />
                <Button
                  title="Salvar cronograma"
                  onPress={handleCreate}
                  loading={isSubmitting}
                  style={[styles.footerButton, styles.footerButtonPrimary, isMobileLayout && styles.footerButtonMobile]}
                />
              </View>
            </View>

            {/* Coluna do preview - apenas em desktop/tablet */}
            {!isMobileLayout && (
              <View style={styles.previewColumn}>
                <Card style={styles.previewCardDesktop}>
                  <SectionTitle
                    title="Preview do cronograma"
                    subtitle="Veja como sua rotina será organizada."
                  />

                  <View style={[styles.previewHeaderDesktop, { borderBottomColor: theme.border }]}>
                    <View style={[styles.previewIconDesktop, { backgroundColor: categoryMeta.background }]}>
                      <Text style={[styles.previewIconTextDesktop, { color: categoryMeta.color }]}>
                        {categoryMeta.icon}
                      </Text>
                    </View>
                    <View style={styles.previewHeaderInfoDesktop}>
                      <Text style={[styles.previewTitleDesktop, { color: theme.text }]}>
                        {title || "Seu novo cronograma"}
                      </Text>
                      <Text style={[styles.previewDescriptionDesktop, { color: theme.textMuted }]}>
                        {description || "Rotina com contexto, lembretes e organização inteligente."}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.previewRowsDesktop}>
                    <View style={styles.previewRowDesktop}>
                      <Text style={[styles.previewLabelDesktop, { color: theme.textMuted }]}>Categoria</Text>
                      <Text style={[styles.previewValueDesktop, { color: theme.text }]}>{categoryMeta.label}</Text>
                    </View>
                    <View style={styles.previewRowDesktop}>
                      <Text style={[styles.previewLabelDesktop, { color: theme.textMuted }]}>Alarmes</Text>
                      <Text style={[styles.previewValueDesktop, { color: theme.text }]}>{alarmsEnabled ? "Ativados" : "Desativados"}</Text>
                    </View>
                    <View style={styles.previewRowDesktop}>
                      <Text style={[styles.previewLabelDesktop, { color: theme.textMuted }]}>Lembrete antes</Text>
                      <Text style={[styles.previewValueDesktop, { color: theme.text }]}>{reminderBeforeMinutes} min</Text>
                    </View>
                    <View style={styles.previewRowDesktop}>
                      <Text style={[styles.previewLabelDesktop, { color: theme.textMuted }]}>Prioridade</Text>
                      <Text style={[styles.previewValueDesktop, { color: theme.text }]}>{priority}</Text>
                    </View>
                  </View>
                </Card>

                <Card style={[styles.aiCard, { borderColor: theme.accentSoft }]}>
                  <Text style={styles.aiTitle}>Assistente de Rotina AI ✦</Text>
                  <Text style={[styles.aiText, { color: theme.textMuted }]}>
                    Com base nas informações fornecidas, a IA poderá sugerir horários ideais, revisões e alertas mais precisos.
                  </Text>
                  <Button
                    title="Gerar cronograma com IA"
                    variant="ai"
                    onPress={() =>
                      router.push({
                        pathname: "/ai-prompt",
                        params: { prefillPrompt: buildAiPromptFromDraft() }
                      })
                    }
                    style={{ marginTop: spacing.lg }}
                  />
                </Card>
              </View>
            )}
          </View>

          {/* Card AI no mobile - aparece no final */}
          {isMobileLayout && (
            <Card style={[styles.aiCardMobile, { borderColor: theme.accentSoft }]}>
              <Text style={styles.aiTitle}>Assistente de Rotina AI ✦</Text>
              <Text style={[styles.aiText, { color: theme.textMuted }]}>
                A IA pode sugerir horários ideais e alertas mais precisos.
              </Text>
              <Button
                title="Gerar cronograma com IA"
                variant="ai"
                onPress={() =>
                  router.push({
                    pathname: "/ai-prompt",
                    params: { prefillPrompt: buildAiPromptFromDraft() }
                  })
                }
                style={{ marginTop: spacing.md }}
              />
            </Card>
          )}
        </KeyboardAvoidingView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1
  },

  backButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  backText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 14
  },

  // Grid layout
  grid: {
    flexDirection: "row",
    gap: spacing.xl,
    alignItems: "flex-start"
  },
  gridMobile: {
    flexDirection: "column",
    gap: spacing.md
  },

  // Form column
  formColumn: {
    flex: 1.7
  },
  formColumnMobile: {
    flex: 1,
    width: "100%"
  },

  // Preview column (desktop)
  previewColumn: {
    flex: 0.85,
    gap: spacing.lg
  },

  // Section cards
  sectionCard: {
    marginBottom: spacing.md
  },

  // Categories
  categoryRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md
  },
  categoryPill: {
    minHeight: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  categoryText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 13
  },

  // Settings grid
  settingGrid: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap"
  },
  settingGridMobile: {
    flexDirection: "column"
  },
  settingBox: {
    flex: 1,
    minWidth: 140,
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  settingBoxMobile: {
    flex: undefined,
    width: "100%",
    minHeight: 64
  },
  settingIcon: {
    fontSize: 24,
    color: colors.primary
  },
  settingInfo: {
    flex: 1
  },
  settingTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 2
  },
  settingText: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13
  },

  // Footer actions
  footerActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.sm
  },
  footerActionsMobile: {
    flexDirection: "column-reverse"
  },
  footerButton: {
    flex: 1,
    minHeight: 48
  },
  footerButtonMobile: {
    flex: undefined,
    width: "100%"
  },
  footerButtonPrimary: {},

  // Preview card (mobile - colapsavel)
  previewCard: {
    marginBottom: spacing.md,
    padding: spacing.md
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  previewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    minWidth: 0
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  previewIconText: {
    fontFamily: fonts.title,
    fontSize: 22
  },
  previewHeaderInfo: {
    flex: 1,
    minWidth: 0
  },
  previewTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 15
  },
  previewSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2
  },
  expandIcon: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: spacing.sm
  },
  previewContent: {
    marginTop: spacing.md
  },
  previewDescription: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    fontSize: 13
  },
  previewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md
  },
  previewRows: {
    gap: spacing.sm
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  previewLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13
  },
  previewValue: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 13
  },

  // Preview card (desktop)
  previewCardDesktop: {
    padding: spacing.xl
  },
  previewHeaderDesktop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  previewIconDesktop: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  previewIconTextDesktop: {
    fontFamily: fonts.title,
    fontSize: 26
  },
  previewHeaderInfoDesktop: {
    flex: 1,
    minWidth: 0
  },
  previewTitleDesktop: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 18
  },
  previewDescriptionDesktop: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.xs
  },
  previewRowsDesktop: {
    marginTop: spacing.lg,
    gap: spacing.md
  },
  previewRowDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  previewLabelDesktop: {
    color: colors.textMuted,
    fontFamily: fonts.medium
  },
  previewValueDesktop: {
    color: colors.text,
    fontFamily: fonts.bold
  },

  // AI Card
  aiCard: {
    borderColor: "#DDD6FE",
    padding: spacing.xl
  },
  aiCardMobile: {
    borderColor: "#DDD6FE",
    marginTop: spacing.md,
    marginBottom: spacing.xl
  },
  aiTitle: {
    color: colors.accent,
    fontFamily: fonts.title,
    fontSize: 16
  },
  aiText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.sm,
    fontSize: 13
  }
});
