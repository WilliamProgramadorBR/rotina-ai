import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../src/services/api";
import { Reminder, Schedule } from "../../src/types/entities";
import {
  colors,
  fonts,
  getCategoryMeta,
  getPriorityMeta,
  radius,
  scaledFont,
  shadow,
  spacing
} from "../../src/theme";
import { formatLongDate, formatTime } from "../../src/utils/date";
import { countOverdueReminders, formatOverdueLabel, isReminderOverdue } from "../../src/utils/reminderStatus";
import { Button, EmptyState, LoadingState } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useThemeMode } from "../../src/context/ThemeContext";
import { IconSymbol } from "../../src/components/IconSymbol";
import { useResponsive } from "../../src/hooks/useResponsive";
import { updateReminderOfflineSafeRequest } from "../../src/services/reminders";

type Linkable = {
  links?: string[] | null;
  linksJson?: string | null;
};

function parseLinksText(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLinks(source?: Linkable | null) {
  if (!source) return [];

  if (Array.isArray(source.links)) {
    return source.links.map((link) => link.trim()).filter(Boolean);
  }

  if (!source.linksJson) return [];

  try {
    const parsed = JSON.parse(source.linksJson);

    if (Array.isArray(parsed)) {
      return parsed.map((link) => String(link).trim()).filter(Boolean);
    }
  } catch {
    return parseLinksText(source.linksJson);
  }

  return [];
}

function normalizeLink(link: string) {
  const trimmed = link.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getLinkLabel(link: string) {
  try {
    const url = new URL(normalizeLink(link));
    return url.hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

function getPeriodLabel(value: string) {
  const date = new Date(value);
  const hour = date.getHours();

  if (Number.isNaN(date.getTime())) return "Sem horario";
  if (hour < 6) return "Madrugada";
  if (hour < 12) return "Manha";
  if (hour < 18) return "Tarde";
  return "Noite";
}

function getAlarmLevelMeta(level?: string | null) {
  switch ((level || "IMPORTANTE").toUpperCase()) {
    case "CRITICO":
      return { label: "Critico", color: colors.danger, bg: colors.dangerSoft, icon: "bell-alert-outline" };
    case "LEVE":
      return { label: "Leve", color: colors.success, bg: colors.successSoft, icon: "bell-outline" };
    case "ROTINA":
      return { label: "Rotina", color: "#0284C7", bg: "#E0F2FE", icon: "water-outline" };
    default:
      return { label: "Importante", color: colors.primary, bg: colors.primarySoft, icon: "bell-ring-outline" };
  }
}

function MetricCard({
  title,
  value,
  caption,
  icon,
  tone,
  compact
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: string;
  tone: "blue" | "green" | "danger" | "violet";
  compact: boolean;
}) {
  const { theme } = useThemeMode();
  const { width } = useResponsive();
  const color =
    tone === "green" ? theme.success
    : tone === "danger" ? theme.danger
    : tone === "violet" ? theme.accent
    : theme.primary;
  const bg =
    tone === "green" ? theme.successSoft
    : tone === "danger" ? theme.dangerSoft
    : tone === "violet" ? theme.accentSoft
    : theme.primarySoft;

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }, compact && styles.metricCardCompact]}>
      <View style={[styles.metricIcon, { backgroundColor: bg }]}>
        <IconSymbol name={icon as any} size={compact ? 16 : 18} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: theme.text, fontSize: scaledFont(compact ? 20 : 24, width) }]}>{value}</Text>
      <Text style={[styles.metricTitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>{title}</Text>
      <Text style={[styles.metricCaption, { color: theme.textSoft, fontSize: scaledFont(11, width) }]}>{caption}</Text>
    </View>
  );
}

function LinkChips({ links, compact = false }: { links: string[]; compact?: boolean }) {
  const { theme } = useThemeMode();

  if (links.length === 0) return null;

  async function openLink(link: string) {
    try {
      await Linking.openURL(normalizeLink(link));
    } catch {
      Alert.alert("Link indisponivel", "Nao foi possivel abrir este link agora.");
    }
  }

  return (
    <View style={[styles.linkList, compact && styles.linkListCompact]}>
      {links.map((link, index) => (
        <Pressable
          key={`${link}-${index}`}
          onPress={() => openLink(link)}
          style={({ pressed }) => [
            styles.linkChip,
            { backgroundColor: theme.primarySoft, borderColor: theme.focusRing },
            pressed && styles.pressed
          ]}
        >
          <IconSymbol name="link-variant" size={14} color={theme.primary} />
          <Text style={[styles.linkText, { color: theme.primary }]} numberOfLines={1}>
            {getLinkLabel(link)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ScheduleDetailScreen() {
  const { theme, isDark } = useThemeMode();
  const { width, isPhone, isSmallPhone, isTablet, isDesktop, gap } = useResponsive();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [linksDraft, setLinksDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const isCompact = isPhone || isSmallPhone;
  const isTwoColumn = isDesktop;

  const loadSchedule = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/schedules/${id}`);
      setSchedule(response.data.schedule);
    } catch (error: any) {
      console.log("[SCHEDULE DETAIL ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar o cronograma.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { loadSchedule(); }, [loadSchedule]));

  const reminders = useMemo(() => schedule?.reminders || [], [schedule]);
  const overdueCount = useMemo(() => countOverdueReminders(reminders), [reminders]);
  const scheduleLinks = useMemo(() => parseLinks(schedule), [schedule]);
  const meta = getCategoryMeta(schedule?.category);

  const grouped = useMemo(() => {
    const periodOrder = ["Madrugada", "Manha", "Tarde", "Noite", "Sem horario"];

    return periodOrder
      .map((period) => ({
        period,
        data: reminders.filter((reminder) => getPeriodLabel(reminder.startAt) === period)
      }))
      .filter((group) => group.data.length > 0);
  }, [reminders]);

  async function deleteSchedule() {
    if (!schedule) return;

    Alert.alert("Remover cronograma", "Essa acao remove o cronograma e seus lembretes. Deseja continuar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/schedules/${schedule.id}`);
            router.replace("/schedules");
          } catch (error: any) {
            Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel remover.");
          }
        }
      }
    ]);
  }

  function openReminderNotes(reminder: Reminder) {
    setEditingReminder(reminder);
    setNoteDraft(reminder.notes || "");
    setLinksDraft(parseLinks(reminder).join("\n"));
  }

  function closeReminderNotes(force = false) {
    if (isSavingNote && !force) return;
    setEditingReminder(null);
    setNoteDraft("");
    setLinksDraft("");
  }

  async function saveReminderNotes() {
    if (!editingReminder) return;

    try {
      setIsSavingNote(true);
      const result = await updateReminderOfflineSafeRequest(editingReminder.id, {
        notes: noteDraft.trim() || null,
        links: parseLinksText(linksDraft)
      });
      const updatedReminder = result.reminder || {
        ...editingReminder,
        notes: noteDraft.trim() || null,
        linksJson: JSON.stringify(parseLinksText(linksDraft))
      };

      setSchedule((current) => {
        if (!current) return current;

        return {
          ...current,
          reminders: (current.reminders || []).map((reminder) =>
            reminder.id === updatedReminder.id ? { ...reminder, ...updatedReminder } : reminder
          )
        };
      });

      closeReminderNotes(true);

      if (result.queued) {
        Alert.alert("Salvo offline", "A observacao sera sincronizada quando a internet voltar.");
      }
    } catch (error: any) {
      console.log("[UPDATE REMINDER NOTES ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel salvar a observacao.");
    } finally {
      setIsSavingNote(false);
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader
            title="Detalhes"
            subtitle="Cronograma, links e tarefas"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <IconSymbol name="arrow-left" size={16} color={theme.text} />
                {!isSmallPhone ? <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text> : null}
              </Pressable>
            }
          />

          {isLoading ? (
            <LoadingState label="Carregando cronograma..." />
          ) : !schedule ? (
            <EmptyState
              iconName="clipboard-alert-outline"
              title="Cronograma nao encontrado"
              description="Nao foi possivel localizar este cronograma."
            />
          ) : (
            <View style={styles.page}>
              <View
                style={[
                  styles.hero,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isCompact && styles.heroCompact
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: meta.background, borderColor: meta.border }]}>
                  <IconSymbol name={meta.iconName} size={isCompact ? 24 : 30} color={meta.color} />
                </View>

                <View style={styles.heroContent}>
                  <View style={styles.heroTopLine}>
                    <View style={[styles.categoryPill, { backgroundColor: meta.background, borderColor: meta.border }]}>
                      <Text style={[styles.categoryPillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <View style={[styles.categoryPill, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                      <IconSymbol name="calendar-clock" size={13} color={theme.textMuted} />
                      <Text style={[styles.subtlePillText, { color: theme.textMuted }]}>
                        {reminders.length} {reminders.length === 1 ? "tarefa" : "tarefas"}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.title, { color: theme.text, fontSize: scaledFont(isCompact ? 22 : 28, width) }]}>
                    {schedule.title}
                  </Text>
                  {schedule.description ? (
                    <Text style={[styles.description, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
                      {schedule.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.metricsGrid, { gap }]}>
                <MetricCard title="Tarefas" value={reminders.length} caption="alarmes no cronograma" icon="format-list-checks" tone="blue" compact={isCompact} />
                <MetricCard title="Progresso" value={`${schedule.progress?.completionRate ?? 0}%`} caption="concluidas" icon="check-decagram-outline" tone="green" compact={isCompact} />
                <MetricCard title="Atrasadas" value={overdueCount} caption="pedem revisao" icon="alert-circle-outline" tone="danger" compact={isCompact} />
                <MetricCard title="Contexto" value={scheduleLinks.length + (schedule.notes ? 1 : 0) + (schedule.extraInfo ? 1 : 0)} caption="links e notas" icon="note-text-outline" tone="violet" compact={isCompact} />
              </View>

              <View style={[styles.contentGrid, isTwoColumn && styles.contentGridWide]}>
                <View style={[styles.mainColumn, isTwoColumn && styles.mainColumnWide]}>
                  <View style={[styles.actions, isCompact && styles.actionsCompact]}>
                    <Button
                      title="Novo lembrete"
                      icon="plus"
                      onPress={() => router.push({ pathname: "/reminders/new", params: { scheduleId: schedule.id } })}
                      style={[styles.actionButton, isCompact && styles.actionButtonCompact]}
                    />
                    <Button
                      title="Remover"
                      icon="delete-outline"
                      variant="danger"
                      onPress={deleteSchedule}
                      style={[styles.actionButton, isCompact && styles.actionButtonCompact]}
                    />
                  </View>

                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>
                        Tarefas do cronograma
                      </Text>
                      <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                        Cada alarme pode ter observacoes e links proprios.
                      </Text>
                    </View>
                  </View>

                  {grouped.length === 0 ? (
                    <EmptyState
                      iconName="bell-plus-outline"
                      title="Sem lembretes"
                      description="Adicione o primeiro lembrete para ativar este cronograma."
                      action={
                        <Button
                          title="Adicionar lembrete"
                          icon="plus"
                          onPress={() => router.push({ pathname: "/reminders/new", params: { scheduleId: schedule.id } })}
                        />
                      }
                    />
                  ) : (
                    <View style={styles.timeline}>
                      {grouped.map((group) => (
                        <View key={group.period} style={styles.period}>
                          <View style={styles.periodHeader}>
                            <Text style={[styles.periodTitle, { color: theme.text }]}>{group.period}</Text>
                            <View style={[styles.periodCount, { backgroundColor: theme.surfaceMuted }]}>
                              <Text style={[styles.periodCountText, { color: theme.textMuted }]}>
                                {group.data.length}
                              </Text>
                            </View>
                          </View>

                          {group.data.map((reminder: Reminder) => {
                            const overdue = isReminderOverdue(reminder);
                            const reminderLinks = parseLinks(reminder);
                            const priority = getPriorityMeta(reminder.priority || "NORMAL");
                            const alarm = getAlarmLevelMeta(reminder.alarmLevel);

                            return (
                              <View
                                key={reminder.id}
                                style={[
                                  styles.reminderCard,
                                  { backgroundColor: theme.surface, borderColor: theme.border },
                                  overdue && { backgroundColor: isDark ? "#2A1626" : colors.dangerSoft, borderColor: "#FECDD6" },
                                  isCompact && styles.reminderCardCompact
                                ]}
                              >
                                <View style={[styles.timeRail, isCompact && styles.timeRailCompact]}>
                                  <Text style={[styles.reminderTime, { color: overdue ? colors.danger : meta.color }]}>
                                    {formatTime(reminder.startAt)}
                                  </Text>
                                  {!isCompact ? (
                                    <Text style={[styles.reminderDate, { color: theme.textMuted }]} numberOfLines={2}>
                                      {formatLongDate(reminder.startAt)}
                                    </Text>
                                  ) : null}
                                </View>

                                <View style={styles.reminderBody}>
                                  <View style={styles.reminderHeader}>
                                    <View style={styles.reminderTitleBox}>
                                      <Text style={[styles.reminderTitle, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                                        {reminder.title}
                                      </Text>
                                      {reminder.description ? (
                                        <Text style={[styles.reminderDescription, { color: theme.textMuted }]} numberOfLines={3}>
                                          {reminder.description}
                                        </Text>
                                      ) : null}
                                    </View>

                                    <Pressable
                                      onPress={() => openReminderNotes(reminder)}
                                      style={({ pressed }) => [
                                        styles.editButton,
                                        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                                        pressed && styles.pressed
                                      ]}
                                    >
                                      <IconSymbol name={reminder.notes ? "pencil" : "note-plus-outline"} size={16} color={theme.primary} />
                                      {!isSmallPhone ? (
                                        <Text style={[styles.editButtonText, { color: theme.primary }]}>
                                          {reminder.notes ? "Editar obs." : "Add obs."}
                                        </Text>
                                      ) : null}
                                    </Pressable>
                                  </View>

                                  <View style={styles.badgeRow}>
                                    <View style={[styles.metaBadge, { backgroundColor: alarm.bg }]}>
                                      <IconSymbol name={alarm.icon as any} size={12} color={alarm.color} />
                                      <Text style={[styles.metaBadgeText, { color: alarm.color }]}>{alarm.label}</Text>
                                    </View>
                                    <View style={[styles.metaBadge, { backgroundColor: priority.background, borderColor: priority.border }]}>
                                      <IconSymbol name="flag-outline" size={12} color={priority.color} />
                                      <Text style={[styles.metaBadgeText, { color: priority.color }]}>{priority.label}</Text>
                                    </View>
                                    {reminder.location ? (
                                      <View style={[styles.metaBadge, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                                        <IconSymbol name="map-marker-outline" size={12} color={theme.textMuted} />
                                        <Text style={[styles.metaBadgeText, { color: theme.textMuted }]}>{reminder.location}</Text>
                                      </View>
                                    ) : null}
                                  </View>

                                  {reminder.notes ? (
                                    <View style={[styles.noteBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                                      <IconSymbol name="note-text-outline" size={16} color={theme.textMuted} />
                                      <Text style={[styles.noteText, { color: theme.textMuted }]}>{reminder.notes}</Text>
                                    </View>
                                  ) : null}

                                  <LinkChips links={reminderLinks} compact={isCompact} />

                                  {overdue ? (
                                    <Text style={styles.overdueText}>{formatOverdueLabel(reminder.startAt)}</Text>
                                  ) : null}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.sideColumn, isTwoColumn && styles.sideColumnWide]}>
                  <View style={[styles.contextPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.contextHeader}>
                      <View style={[styles.contextIcon, { backgroundColor: theme.accentSoft }]}>
                        <IconSymbol name="folder-information-outline" size={20} color={theme.accent} />
                      </View>
                      <View style={styles.contextTitleBox}>
                        <Text style={[styles.contextTitle, { color: theme.text }]}>Contexto</Text>
                        <Text style={[styles.contextSubtitle, { color: theme.textMuted }]}>Materiais e observacoes do cronograma.</Text>
                      </View>
                    </View>

                    {schedule.notes ? (
                      <View style={styles.contextBlock}>
                        <Text style={[styles.contextLabel, { color: theme.text }]}>Observacoes gerais</Text>
                        <Text style={[styles.contextText, { color: theme.textMuted }]}>{schedule.notes}</Text>
                      </View>
                    ) : null}

                    {schedule.extraInfo ? (
                      <View style={styles.contextBlock}>
                        <Text style={[styles.contextLabel, { color: theme.text }]}>Informacoes extras</Text>
                        <Text style={[styles.contextText, { color: theme.textMuted }]}>{schedule.extraInfo}</Text>
                      </View>
                    ) : null}

                    {scheduleLinks.length > 0 ? (
                      <View style={styles.contextBlock}>
                        <Text style={[styles.contextLabel, { color: theme.text }]}>Links uteis</Text>
                        <LinkChips links={scheduleLinks} />
                      </View>
                    ) : null}

                    {!schedule.notes && !schedule.extraInfo && scheduleLinks.length === 0 ? (
                      <View style={[styles.emptyContext, { backgroundColor: theme.surfaceMuted }]}>
                        <IconSymbol name="link-plus" size={20} color={theme.textMuted} />
                        <Text style={[styles.emptyContextText, { color: theme.textMuted }]}>
                          Sem links ou observacoes salvas neste cronograma.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          )}

          <Modal
            visible={Boolean(editingReminder)}
            transparent
            animationType="fade"
            onRequestClose={() => closeReminderNotes()}
          >
            <View style={styles.modalRoot}>
              <Pressable style={styles.modalBackdrop} onPress={() => closeReminderNotes()} />
              <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleBox}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Observacao da tarefa</Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
                      {editingReminder?.title || "Tarefa"}
                    </Text>
                  </View>
                  <Pressable onPress={() => closeReminderNotes()} style={[styles.modalClose, { backgroundColor: theme.surfaceMuted }]}>
                    <IconSymbol name="close" size={20} color={theme.textMuted} />
                  </Pressable>
                </View>

                <Text style={[styles.inputLabel, { color: theme.text }]}>Observacoes</Text>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder="Adicione instrucoes, cuidados ou contexto desta tarefa."
                  placeholderTextColor={theme.textSoft}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.modalInput,
                    styles.modalInputMultiline,
                    { color: theme.text, backgroundColor: theme.surfaceMuted, borderColor: theme.border }
                  ]}
                />

                <Text style={[styles.inputLabel, { color: theme.text }]}>Links da tarefa</Text>
                <TextInput
                  value={linksDraft}
                  onChangeText={setLinksDraft}
                  placeholder="Cole um link por linha."
                  placeholderTextColor={theme.textSoft}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                  style={[
                    styles.modalInput,
                    { color: theme.text, backgroundColor: theme.surfaceMuted, borderColor: theme.border }
                  ]}
                />

                <View style={styles.modalActions}>
                  <Button title="Cancelar" variant="secondary" onPress={closeReminderNotes} style={styles.modalActionButton} />
                  <Button title="Salvar" onPress={saveReminderNotes} loading={isSavingNote} style={styles.modalActionButton} />
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    minWidth: 0
  },
  backButton: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  backText: {
    fontFamily: fonts.bold
  },
  hero: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft
  },
  heroCompact: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md
  },
  iconBox: {
    width: 66,
    height: 66,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  heroContent: {
    flex: 1,
    minWidth: 0
  },
  heroTopLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  categoryPill: {
    minHeight: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  categoryPillText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  subtlePillText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  title: {
    fontFamily: fonts.title,
    lineHeight: 34
  },
  description: {
    fontFamily: fonts.regular,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 145,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.soft
  },
  metricCardCompact: {
    flexBasis: "47%",
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radius.lg
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm
  },
  metricValue: {
    fontFamily: fonts.title
  },
  metricTitle: {
    fontFamily: fonts.bold,
    marginTop: 2
  },
  metricCaption: {
    fontFamily: fonts.regular,
    marginTop: spacing.xs
  },
  contentGrid: {
    gap: spacing.lg
  },
  contentGridWide: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  mainColumn: {
    width: "100%"
  },
  mainColumnWide: {
    flex: 1.75,
    width: undefined
  },
  sideColumn: {
    width: "100%"
  },
  sideColumnWide: {
    flex: 0.85,
    width: undefined
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl
  },
  actionsCompact: {
    flexDirection: "column"
  },
  actionButton: {
    flex: 1
  },
  actionButtonCompact: {
    flex: undefined,
    width: "100%"
  },
  sectionHeader: {
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontFamily: fonts.title
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    marginTop: 2
  },
  timeline: {
    gap: spacing.lg
  },
  period: {
    marginBottom: spacing.lg
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm
  },
  periodTitle: {
    fontFamily: fonts.title,
    fontSize: 16
  },
  periodCount: {
    minWidth: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  periodCountText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  reminderCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft
  },
  reminderCardCompact: {
    flexDirection: "column",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  timeRail: {
    width: 104,
    alignItems: "flex-start"
  },
  timeRailCompact: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  reminderTime: {
    fontFamily: fonts.title,
    fontSize: 22
  },
  reminderDate: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs
  },
  reminderBody: {
    flex: 1,
    minWidth: 0
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  reminderTitleBox: {
    flex: 1,
    minWidth: 0
  },
  reminderTitle: {
    fontFamily: fonts.title
  },
  reminderDescription: {
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.xs
  },
  editButton: {
    minHeight: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs
  },
  editButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  metaBadge: {
    minHeight: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  noteBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.regular,
    lineHeight: 19
  },
  linkList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  linkListCompact: {
    gap: spacing.xs
  },
  linkChip: {
    maxWidth: "100%",
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  linkText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    maxWidth: 220
  },
  overdueText: {
    color: colors.danger,
    fontFamily: fonts.bold,
    marginTop: spacing.md
  },
  contextPanel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.soft
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  contextIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  contextTitleBox: {
    flex: 1,
    minWidth: 0
  },
  contextTitle: {
    fontFamily: fonts.title,
    fontSize: 16
  },
  contextSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2
  },
  contextBlock: {
    marginTop: spacing.md
  },
  contextLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: spacing.xs
  },
  contextText: {
    fontFamily: fonts.regular,
    lineHeight: 20
  },
  emptyContext: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm
  },
  emptyContextText: {
    fontFamily: fonts.medium,
    textAlign: "center",
    lineHeight: 19
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 11, 22, 0.62)"
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.medium
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  modalTitleBox: {
    flex: 1,
    minWidth: 0
  },
  modalTitle: {
    fontFamily: fonts.title,
    fontSize: 18
  },
  modalSubtitle: {
    fontFamily: fonts.medium,
    marginTop: 2
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: spacing.sm
  },
  modalInput: {
    minHeight: 86,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: spacing.lg
  },
  modalInputMultiline: {
    minHeight: 128
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md
  },
  modalActionButton: {
    flex: 1
  }
});
