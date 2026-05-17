import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../src/components/ui";
import { ScheduleCard } from "../../src/components/ScheduleCard";
import { IconSymbol } from "../../src/components/IconSymbol";
import { CollaborationGroup } from "../../src/types/entities";
import {
  createCollaborationScheduleFromSuggestionRequest,
  createCollaborationScheduleRequest,
  getCollaborationGroupRequest,
  inviteCollaborationMemberRequest,
  leaveCollaborationGroupRequest,
  suggestCollaborationScheduleRequest
} from "../../src/services/collaboration";
import { fonts, radius, spacing, scaledFont } from "../../src/theme";
import { useResponsive } from "../../src/hooks/useResponsive";
import { useThemeMode } from "../../src/context/ThemeContext";

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CollaborationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = String(params.id || "");
  const { width, isPhone, isSmallPhone } = useResponsive();
  const { theme } = useThemeMode();
  const [group, setGroup] = useState<CollaborationGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [isCreatingWithAi, setIsCreatingWithAi] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isMobile = isPhone || isSmallPhone;

  const loadGroup = useCallback(async (silent = false) => {
    if (!groupId) return;

    try {
      if (!silent) setIsLoading(true);
      const loadedGroup = await getCollaborationGroupRequest(groupId);
      setGroup(loadedGroup);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar o grupo.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => {
    loadGroup();
  }, [loadGroup]));

  const stats = useMemo(() => {
    const schedules = group?.schedules || [];
    const reminders = schedules.flatMap((schedule) => schedule.reminders || []);
    const done = reminders.filter((reminder) =>
      (reminder.logs || []).some((log) => log.action === "DONE")
    ).length;

    return {
      members: group?.members?.length || 0,
      schedules: schedules.length,
      reminders: reminders.length,
      done
    };
  }, [group]);

  async function handleInvite() {
    try {
      if (!email.trim()) {
        Alert.alert("Convite", "Informe o e-mail do usuario.");
        return;
      }

      setIsInviting(true);
      await inviteCollaborationMemberRequest(groupId, {
        email: email.trim().toLowerCase(),
        message: inviteMessage.trim() || undefined
      });
      setEmail("");
      setInviteMessage("");
      await loadGroup(true);
      Alert.alert("Convite enviado", "Quando o usuario aceitar, ele entra no grupo.");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel enviar o convite.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleCreateSchedule() {
    try {
      if (scheduleTitle.trim().length < 2) {
        Alert.alert("Rotina", "Informe um titulo para a rotina.");
        return;
      }

      setIsCreatingSchedule(true);
      await createCollaborationScheduleRequest(groupId, {
        title: scheduleTitle.trim(),
        description: scheduleDescription.trim() || undefined,
        category: "WORK"
      });
      setScheduleTitle("");
      setScheduleDescription("");
      await loadGroup(true);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel criar a rotina.");
    } finally {
      setIsCreatingSchedule(false);
    }
  }

  async function handleCreateWithAi() {
    try {
      if (aiPrompt.trim().length < 5) {
        Alert.alert("IA", "Descreva o objetivo do grupo para a IA.");
        return;
      }

      setIsCreatingWithAi(true);
      const suggestion = await suggestCollaborationScheduleRequest(groupId, {
        prompt: aiPrompt.trim(),
        startDate: getTodayDate(),
        timezone: "America/Sao_Paulo"
      });
      await createCollaborationScheduleFromSuggestionRequest(groupId, suggestion);
      setAiPrompt("");
      await loadGroup(true);
      Alert.alert("Plano criado", "A IA transformou o objetivo em uma rotina compartilhada.");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel criar a rotina com IA.");
    } finally {
      setIsCreatingWithAi(false);
    }
  }

  function handleLeaveGroup() {
    if (!group) return;

    Alert.alert(
      "Sair do grupo",
      "Voce deixara de ver as rotinas compartilhadas deste grupo. Se voce for o unico membro, o grupo sera removido.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLeaving(true);
              const result = await leaveCollaborationGroupRequest(groupId);
              router.replace("/collaboration");
              Alert.alert("Grupo", result.message || "Voce saiu do grupo.");
            } catch (error: any) {
              Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel sair do grupo.");
            } finally {
              setIsLeaving(false);
            }
          }
        }
      ]
    );
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title={group?.name || "Grupo"}
            subtitle={group?.description || "Rotina compartilhada com tarefas em conjunto"}
            onMenu={isWide ? undefined : openMenu}
            right={
              <View style={styles.headerActions}>
                <Button
                  title={isMobile ? "Voltar" : "Grupos"}
                  icon="arrow-left"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push("/collaboration")}
                />
                {group ? (
                  <Button
                    title="Sair"
                    icon="logout"
                    variant="danger"
                    size="sm"
                    onPress={handleLeaveGroup}
                    loading={isLeaving}
                  />
                ) : null}
              </View>
            }
          />

          {isLoading ? (
            <LoadingState label="Carregando grupo..." />
          ) : !group ? (
            <EmptyState
              iconName="account-group-outline"
              title="Grupo nao encontrado"
              description="Verifique se voce ainda faz parte deste grupo."
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    loadGroup(true);
                  }}
                />
              }
              contentContainerStyle={styles.content}
            >
              <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
                <Stat label="Membros" value={stats.members} icon="account-group-outline" />
                <Stat label="Rotinas" value={stats.schedules} icon="format-list-checks" />
                <Stat label="Tarefas" value={stats.reminders} icon="checkbox-marked-circle-outline" />
                <Stat label="Feitas" value={stats.done} icon="check-circle-outline" />
              </View>

              <Card>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={[styles.panelTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>
                      Convidar usuario
                    </Text>
                    <Text style={[styles.panelSubtitle, { color: theme.textMuted }]}>
                      O convite aparece para usuarios cadastrados com esse e-mail.
                    </Text>
                  </View>
                  <IconSymbol name="account-plus-outline" size={22} color={theme.primary} />
                </View>
                <Input
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="colega@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Input
                  label="Mensagem"
                  value={inviteMessage}
                  onChangeText={setInviteMessage}
                  placeholder="Ex: vamos organizar o trabalho de historia aqui"
                  multiline
                />
                <Button title="Enviar convite" icon="send-outline" onPress={handleInvite} loading={isInviting} />
              </Card>

              <Card>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={[styles.panelTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>
                      Criar rotina com IA
                    </Text>
                    <Text style={[styles.panelSubtitle, { color: theme.textMuted }]}>
                      A IA quebra o objetivo em tarefas para o grupo executar.
                    </Text>
                  </View>
                  <IconSymbol name="auto-fix" size={22} color={theme.accent} />
                </View>
                <Input
                  label="Objetivo"
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="Ex: trabalho de escola sobre sustentabilidade para entregar sexta"
                  multiline
                />
                <Button title="Gerar rotina do grupo" icon="auto-fix" variant="ai" onPress={handleCreateWithAi} loading={isCreatingWithAi} />
              </Card>

              <Card>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={[styles.panelTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>
                      Criar rotina manual
                    </Text>
                    <Text style={[styles.panelSubtitle, { color: theme.textMuted }]}>
                      Comece com uma rotina vazia e adicione tarefas depois.
                    </Text>
                  </View>
                  <IconSymbol name="plus-circle-outline" size={22} color={theme.primary} />
                </View>
                <Input
                  label="Titulo"
                  value={scheduleTitle}
                  onChangeText={setScheduleTitle}
                  placeholder="Ex: Apresentacao de ciencias"
                />
                <Input
                  label="Descricao"
                  value={scheduleDescription}
                  onChangeText={setScheduleDescription}
                  placeholder="Contexto do projeto"
                  multiline
                />
                <Button title="Criar rotina" icon="plus" onPress={handleCreateSchedule} loading={isCreatingSchedule} />
              </Card>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Membros</Text>
                <View style={styles.members}>
                  {(group.members || []).map((member) => (
                    <View key={member.id} style={[styles.memberPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
                        {member.user.name}
                      </Text>
                      <Badge text={member.role === "OWNER" ? "dono" : member.role.toLowerCase()} />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Rotinas compartilhadas</Text>
                {(group.schedules || []).length === 0 ? (
                  <EmptyState
                    iconName="format-list-checks"
                    title="Nenhuma rotina compartilhada"
                    description="Crie uma rotina manual ou peça para a IA montar um plano do grupo."
                  />
                ) : (
                  (group.schedules || []).map((schedule) => (
                    <ScheduleCard key={schedule.id} schedule={schedule} />
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  const { width } = useResponsive();
  const { theme } = useThemeMode();

  return (
    <Card style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: theme.primarySoft }]}>
          <IconSymbol name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={[styles.statValue, { color: theme.text, fontSize: scaledFont(24, width) }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  statsGridMobile: {
    flexWrap: "wrap"
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: spacing.md
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  statValue: {
    fontFamily: fonts.title
  },
  statLabel: {
    fontFamily: fonts.medium,
    marginTop: spacing.sm
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  panelTitle: {
    fontFamily: fonts.title
  },
  panelSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: 18
  },
  members: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  memberPill: {
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  memberName: {
    maxWidth: 150,
    fontFamily: fonts.bold
  }
});
