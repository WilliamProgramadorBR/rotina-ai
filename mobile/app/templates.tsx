import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { PageHeader } from "../src/components/PageHeader";
import { IconSymbol } from "../src/components/IconSymbol";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  background: string;
  prompt: string;
  tags: string[];
  durationLabel: string;
};

const TEMPLATES: Template[] = [
  {
    id: "estudos",
    title: "Rotina de estudos",
    description: "Blocos de estudo focado com revisão diária, pausas estratégicas e revisão semanal.",
    category: "STUDY",
    icon: "school-outline",
    color: "#7C3AED",
    background: "#F3E8FF",
    prompt: "Criar rotina de estudos diária com blocos de 45 minutos de manhã às 08:00 e à noite às 20:00, com pausas de 15 minutos. Incluir revisão de 20 minutos antes de dormir.",
    tags: ["Diária", "Foco", "Revisão"],
    durationLabel: "Diária"
  },
  {
    id: "treino",
    title: "Rotina de treino",
    description: "Treinos de segunda, quarta e sexta com aquecimento, exercício e alongamento.",
    category: "WORKOUT",
    icon: "run",
    color: "#059669",
    background: "#ECFDF5",
    prompt: "Criar rotina de treino físico para segunda, quarta e sexta às 07:00. Incluir aquecimento de 10 minutos, treino de 45 minutos e alongamento de 10 minutos.",
    tags: ["3x semana", "Manhã", "Saúde"],
    durationLabel: "3x semana"
  },
  {
    id: "trabalho",
    title: "Rotina de trabalho",
    description: "Blocos de foco profundo com pausas Pomodoro, reuniões e encerramento produtivo.",
    category: "WORK",
    icon: "briefcase-outline",
    color: "#D97706",
    background: "#FFF7ED",
    prompt: "Criar rotina de trabalho de segunda a sexta das 09:00 às 18:00 com blocos de foco de 90 minutos, pausas de 15 minutos, almoço às 12:00 e revisão de tarefas às 17:30.",
    tags: ["Seg-Sex", "Pomodoro", "Produtividade"],
    durationLabel: "Seg-Sex"
  },
  {
    id: "concurso",
    title: "Rotina para concurso",
    description: "Estudo intensivo com revisão de matérias, simulados e foco em alto desempenho.",
    category: "STUDY",
    icon: "trophy-outline",
    color: "#D97706",
    background: "#FFF7ED",
    prompt: "Criar rotina intensiva para concurso público com estudo das 06:00 às 08:00 e das 19:00 às 22:00, revisão de matéria nos finais de semana às 09:00 e simulado aos domingos às 14:00.",
    tags: ["Intensivo", "Simulado", "Revisão"],
    durationLabel: "Diária"
  },
  {
    id: "faculdade",
    title: "Rotina para faculdade",
    description: "Organização de aulas, revisão de conteúdo e preparação para provas.",
    category: "STUDY",
    icon: "account-school-outline",
    color: "#7C3AED",
    background: "#F3E8FF",
    prompt: "Criar rotina universitária com revisão das aulas do dia às 20:00 por 1 hora, leitura de artigos às quartas às 21:00 e revisão geral aos sábados às 10:00.",
    tags: ["Universidade", "Provas", "Organização"],
    durationLabel: "Diária"
  },
  {
    id: "sono",
    title: "Rotina de sono",
    description: "Higiene do sono com horários fixos para dormir, acordar e rituais noturnos.",
    category: "SLEEP",
    icon: "weather-night",
    color: "#4F46E5",
    background: "#EEF2FF",
    prompt: "Criar rotina de sono saudável: desligar telas às 21:30, preparação para dormir às 22:00, dormir às 22:30 e acordar às 06:30. Incluir lembrete de hidratação ao acordar.",
    tags: ["Noturna", "Qualidade", "Bem-estar"],
    durationLabel: "Diária"
  },
  {
    id: "hidratacao",
    title: "Hidratação diária",
    description: "Lembretes para tomar água ao longo do dia e atingir a meta de hidratação.",
    category: "WATER",
    icon: "water-outline",
    color: "#0284C7",
    background: "#E0F2FE",
    prompt: "Criar lembretes para beber água: ao acordar às 07:00, às 09:00, 11:00, 13:00, 15:00, 17:00 e 19:00. Cada lembrete = 300ml de água.",
    tags: ["Saúde", "Hidratação", "7x dia"],
    durationLabel: "7x dia"
  },
  {
    id: "personalizada",
    title: "Rotina personalizada com IA",
    description: "Descreva sua rotina ideal em texto livre e a IA monta tudo para você.",
    category: "OTHER",
    icon: "auto-fix",
    color: "#2563EB",
    background: "#EAF1FF",
    prompt: "",
    tags: ["IA", "Personalizado", "Livre"],
    durationLabel: "Customizável"
  }
];

export default function TemplatesScreen() {
  const { theme } = useThemeMode();
  const { width, isPhone, isSmallPhone } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const isMobile = isPhone || isSmallPhone;

  const categories = [
    { id: "ALL", label: "Todos" },
    { id: "STUDY", label: "Estudos" },
    { id: "WORKOUT", label: "Treino" },
    { id: "WORK", label: "Trabalho" },
    { id: "SLEEP", label: "Sono" },
    { id: "WATER", label: "Saúde" },
    { id: "OTHER", label: "IA" }
  ];

  const filtered = selectedCategory === "ALL"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === selectedCategory);

  function handleSelectTemplate(template: Template) {
    if (template.id === "personalizada" || !template.prompt) {
      router.push("/ai-prompt");
      return;
    }
    Alert.alert(
      template.title,
      `Gerar "${template.title}" com IA?\n\n${template.description}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Gerar rotina",
          onPress: () =>
            router.push({
              pathname: "/ai-prompt",
              params: { prefillPrompt: template.prompt }
            })
        }
      ]
    );
  }

  return (
    <ScreenLayout scroll={true}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title="Templates"
            subtitle="Rotinas prontas para começar"
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

          {/* Header com explicação */}
          <View style={[styles.heroBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft }]}>
              <IconSymbol name="format-list-bulleted" size={24} color={colors.accent} />
            </View>
            <View style={styles.heroBody}>
              <Text style={[styles.heroTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                Escolha um template
              </Text>
              <Text style={[styles.heroDesc, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                A IA vai personalizar o template para você. Você revisa tudo antes de salvar.
              </Text>
            </View>
          </View>

          {/* Filtros de categoria */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedCategory === cat.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: selectedCategory === cat.id ? colors.white : theme.textMuted, fontSize: scaledFont(13, width) }
                ]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Grid de templates */}
          <View style={[styles.grid, { gap: spacing.md }]}>
            {filtered.map((template) => (
              <Pressable
                key={template.id}
                style={[
                  styles.templateCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isMobile && styles.templateCardMobile
                ]}
                onPress={() => handleSelectTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <View style={[styles.templateIcon, { backgroundColor: template.background }]}>
                    <IconSymbol name={template.icon as any} size={22} color={template.color} />
                  </View>
                  <View style={[styles.durationBadge, { backgroundColor: `${template.color}15` }]}>
                    <Text style={[styles.durationText, { color: template.color, fontSize: scaledFont(11, width) }]}>
                      {template.durationLabel}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.templateTitle, { color: theme.text, fontSize: scaledFont(15, width) }]}>
                  {template.title}
                </Text>
                <Text style={[styles.templateDesc, { color: theme.textMuted, fontSize: scaledFont(12, width) }]} numberOfLines={2}>
                  {template.description}
                </Text>

                <View style={styles.tags}>
                  {template.tags.map((tag) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: theme.surfaceMuted }]}>
                      <Text style={[styles.tagText, { color: theme.textMuted, fontSize: scaledFont(10, width) }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.templateAction, { borderTopColor: theme.border }]}>
                  <Text style={[styles.templateActionText, { color: template.color, fontSize: scaledFont(13, width) }]}>
                    {template.id === "personalizada" ? "Criar do zero com IA" : "Usar este template"}
                  </Text>
                  <IconSymbol name="arrow-right" size={14} color={template.color} />
                </View>
              </Pressable>
            ))}
          </View>
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

  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.soft
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  heroBody: { flex: 1 },
  heroTitle: { fontFamily: fonts.bold },
  heroDesc: { fontFamily: fonts.regular, marginTop: 2, lineHeight: 18 },

  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  filterChip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  filterChipText: { fontFamily: fonts.bold },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  templateCard: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 0,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: "hidden",
    ...shadow.soft
  },
  templateCardMobile: {
    flexBasis: "100%"
  },

  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  durationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  durationText: { fontFamily: fonts.bold },

  templateTitle: { fontFamily: fonts.title, marginBottom: spacing.xs },
  templateDesc: { fontFamily: fonts.regular, lineHeight: 18, marginBottom: spacing.md },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  tagText: { fontFamily: fonts.bold },

  templateAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: spacing.md
  },
  templateActionText: { fontFamily: fonts.bold }
});
