import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../src/components/ui";
import { IconSymbol } from "../../src/components/IconSymbol";
import { CollaborationGroup, CollaborationInvite } from "../../src/types/entities";
import {
  acceptCollaborationInviteRequest,
  createCollaborationGroupRequest,
  declineCollaborationInviteRequest,
  listCollaborationGroupsRequest,
  listCollaborationInvitesRequest
} from "../../src/services/collaboration";
import { fonts, radius, shadow, spacing, scaledFont } from "../../src/theme";
import { useResponsive } from "../../src/hooks/useResponsive";
import { useThemeMode } from "../../src/context/ThemeContext";

export default function CollaborationScreen() {
  const { width, isPhone, isSmallPhone } = useResponsive();
  const { theme } = useThemeMode();
  const [groups, setGroups] = useState<CollaborationGroup[]>([]);
  const [invites, setInvites] = useState<CollaborationInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = isPhone || isSmallPhone;

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [groupList, inviteList] = await Promise.all([
        listCollaborationGroupsRequest(),
        listCollaborationInvitesRequest()
      ]);
      setGroups(groupList);
      setInvites(inviteList);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar a colaboracao.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  async function handleCreateGroup() {
    try {
      if (name.trim().length < 2) {
        Alert.alert("Grupo", "Informe um nome para o grupo.");
        return;
      }

      setIsSubmitting(true);
      const group = await createCollaborationGroupRequest({
        name: name.trim(),
        description: description.trim() || undefined
      });

      setName("");
      setDescription("");
      setShowCreate(false);
      setGroups((current) => [group, ...current]);
      router.push(`/collaboration/${group.id}` as any);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel criar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAcceptInvite(inviteId: string) {
    try {
      await acceptCollaborationInviteRequest(inviteId);
      await loadData(true);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel aceitar o convite.");
    }
  }

  async function handleDeclineInvite(inviteId: string) {
    try {
      await declineCollaborationInviteRequest(inviteId);
      await loadData(true);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel recusar o convite.");
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Colaboracao"
            subtitle="Crie rotinas com outras pessoas e acompanhe tarefas do grupo"
            onMenu={isWide ? undefined : openMenu}
            right={
              <View style={styles.headerActions}>
                <Button
                  title={isMobile ? "Dash" : "Dashboard"}
                  icon="chart-box-outline"
                  variant="secondary"
                  onPress={() => router.push("/collaboration/dashboard")}
                  size="sm"
                />
                <Button
                  title={isMobile ? "Novo" : "Novo grupo"}
                  icon="account-multiple-plus-outline"
                  onPress={() => setShowCreate((value) => !value)}
                  size="sm"
                />
              </View>
            }
          />

          {showCreate ? (
            <Card style={styles.formCard}>
              <Text style={[styles.formTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>
                Novo grupo colaborativo
              </Text>
              <Input
                label="Nome"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Trabalho de escola"
              />
              <Input
                label="Descricao"
                value={description}
                onChangeText={setDescription}
                placeholder="Objetivo, prazo ou contexto do grupo"
                multiline
              />
              <View style={styles.formActions}>
                <Button title="Cancelar" variant="secondary" onPress={() => setShowCreate(false)} style={styles.formButton} />
                <Button title="Criar grupo" onPress={handleCreateGroup} loading={isSubmitting} style={styles.formButton} />
              </View>
            </Card>
          ) : null}

          {isLoading ? (
            <LoadingState label="Carregando grupos..." />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    loadData(true);
                  }}
                />
              }
              contentContainerStyle={styles.content}
            >
              {invites.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Convites pendentes</Text>
                  {invites.map((invite) => (
                    <Card key={invite.id} style={styles.inviteCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.iconShell}>
                          <IconSymbol name="email-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.cardText}>
                          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                            {invite.group?.name || "Grupo colaborativo"}
                          </Text>
                          <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={2}>
                            Convite de {invite.invitedBy?.name || "um membro"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.rowActions}>
                        <Button title="Recusar" variant="secondary" size="sm" onPress={() => handleDeclineInvite(invite.id)} style={styles.actionButton} />
                        <Button title="Aceitar" size="sm" onPress={() => handleAcceptInvite(invite.id)} style={styles.actionButton} />
                      </View>
                    </Card>
                  ))}
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Seus grupos</Text>
                {groups.length === 0 ? (
                  <EmptyState
                    iconName="account-group-outline"
                    title="Nenhum grupo ainda"
                    description="Crie um grupo para dividir tarefas, convidar usuarios e deixar a IA organizar o plano."
                    action={<Button title="Criar grupo" icon="account-multiple-plus-outline" onPress={() => setShowCreate(true)} fullWidth />}
                  />
                ) : (
                  groups.map((group) => {
                    const schedules = group.schedules?.length || 0;
                    const members = group.members?.length || 0;
                    const tasks = (group.schedules || []).reduce((total, schedule) => total + (schedule.reminders?.length || 0), 0);

                    return (
                      <Pressable key={group.id} onPress={() => router.push(`/collaboration/${group.id}` as any)}>
                        <Card style={styles.groupCard}>
                          <View style={styles.cardHeader}>
                            <View style={styles.iconShell}>
                              <IconSymbol name="account-group-outline" size={22} color={theme.primary} />
                            </View>
                            <View style={styles.cardText}>
                              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                                {group.name}
                              </Text>
                              <Text style={[styles.cardSubtitle, { color: theme.textMuted }]} numberOfLines={2}>
                                {group.description || "Rotina compartilhada com progresso em grupo."}
                              </Text>
                            </View>
                            <IconSymbol name="chevron-right" size={22} color={theme.textMuted} />
                          </View>
                          <View style={styles.badges}>
                            <Badge text={`${members} membros`} />
                            <Badge text={`${schedules} rotinas`} variant="tech" />
                            <Badge text={`${tasks} tarefas`} variant="success" />
                          </View>
                        </Card>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
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
  formCard: {
    marginBottom: spacing.lg
  },
  formTitle: {
    fontFamily: fonts.title,
    marginBottom: spacing.lg
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.md
  },
  formButton: {
    flex: 1
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    fontFamily: fonts.title,
    fontSize: 18
  },
  inviteCard: {
    gap: spacing.md
  },
  groupCard: {
    gap: spacing.md,
    marginBottom: spacing.md
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconShell: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37, 99, 235, 0.1)"
  },
  cardText: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing.md
  },
  actionButton: {
    flex: 1
  }
});
