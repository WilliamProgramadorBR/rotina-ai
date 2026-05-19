import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { GestureResponderEvent } from "react-native";
import { colors, fonts, getCategoryMeta, getPriorityMeta, radius, shadow, spacing, scaledFont } from "../theme";
import { useResponsive } from "../hooks/useResponsive";
import { IconSymbol } from "./IconSymbol";
import { useThemeMode } from "../context/ThemeContext";
import {
  formatOverdueLabel,
  isReminderDone,
  isReminderOverdue,
  isReminderSkipped
} from "../utils/reminderStatus";

type ReminderLike = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  startAt: string;
  priority?: string | null;
  alarmLevel?: string | null;
  location?: string | null;
  status?: string | null;
  schedule?: {
    title?: string | null;
    category?: string | null;
  } | null;
  logs?: Array<{ action: string; createdAt?: string | Date | null }>;
};

type ReminderCardProps = {
  reminder: ReminderLike;
  onDone?: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
  onReplan?: () => void;
  onOpenDetails?: () => void;
};

function getAlarmLevelMeta(level?: string | null) {
  switch ((level || "IMPORTANTE").toUpperCase()) {
    case "CRITICO":
      return { label: "Crítico", color: "#E11D48", bg: "#FFF1F2", icon: "bell-alert-outline" };
    case "LEVE":
      return { label: "Leve", color: "#059669", bg: "#ECFDF5", icon: "bell-outline" };
    case "ROTINA":
      return { label: "Rotina", color: "#0284C7", bg: "#E0F2FE", icon: "water-outline" };
    default:
      return { label: "Importante", color: "#2563EB", bg: "#EAF1FF", icon: "bell-ring-outline" };
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function runCardAction(event: GestureResponderEvent, action?: () => void) {
  event.stopPropagation();
  action?.();
}

export function ReminderCard({ reminder, onDone, onSnooze, onSkip, onReplan, onOpenDetails }: ReminderCardProps) {
  const { width, isPhone, isSmallPhone, isPhoneLarge } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const category = getCategoryMeta(reminder.schedule?.category);
  const priority = getPriorityMeta(reminder.priority || "NORMAL");
  const alarmLevelMeta = getAlarmLevelMeta(reminder.alarmLevel);
  const done = isReminderDone(reminder);
  const skipped = isReminderSkipped(reminder);
  const overdue = isReminderOverdue(reminder);
  const overdueLabel = formatOverdueLabel(reminder.startAt);

  const isMobile = isPhone || isSmallPhone || isPhoneLarge;

  return (
    <Pressable
      disabled={!onOpenDetails}
      onPress={onOpenDetails}
      accessibilityRole={onOpenDetails ? "button" : undefined}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        overdue && styles.cardOverdue,
        overdue && { backgroundColor: isDark ? "#2A1626" : theme.dangerSoft, borderColor: "#FECDD6" },
        done && styles.cardDone,
        isMobile && styles.cardMobile
      ]}
    >
      {/* Time Rail - Hidden on very small screens */}
      {!isSmallPhone && (
        <View style={[styles.leftRail, isMobile && styles.leftRailMobile]}>
          <View
            style={[
              styles.timePill,
              {
                backgroundColor: overdue ? colors.dangerSoft : category.background,
                borderColor: overdue ? "#FECDD6" : category.border
              }
            ]}
          >
            <Text style={[styles.timeText, { color: overdue ? colors.danger : category.color, fontSize: scaledFont(12, width) }]}>
              {formatTime(reminder.startAt)}
            </Text>
          </View>
          <View style={[styles.timelineDot, { backgroundColor: overdue ? colors.danger : category.color }]} />
          <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
        </View>
      )}

      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Header Row */}
        <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
          <View style={[
            styles.iconBox,
            { backgroundColor: category.background, borderColor: category.border },
            isMobile && styles.iconBoxMobile
          ]}>
            <IconSymbol name={category.iconName} size={isMobile ? 18 : 22} color={category.color} />
          </View>

          <View style={styles.titleArea}>
            {/* Time badge for mobile */}
            {isSmallPhone && (
              <View style={[styles.timeBadgeMobile, { backgroundColor: overdue ? colors.dangerSoft : category.background }]}>
                <Text style={[styles.timeBadgeMobileText, { color: overdue ? colors.danger : category.color }]}>
                  {formatTime(reminder.startAt)}
                </Text>
              </View>
            )}

            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: theme.text, fontSize: scaledFont(isMobile ? 15 : 17, width) }]}
                numberOfLines={1}
              >
                {reminder.title}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: category.background }]}>
                <Text style={[styles.categoryText, { color: category.color, fontSize: scaledFont(11, width) }]}>
                  {category.label}
                </Text>
              </View>
              {overdue ? (
                <View style={styles.overdueBadge}>
                  <Text style={[styles.overdueBadgeText, { fontSize: scaledFont(11, width) }]}>
                    Atrasado
                  </Text>
                </View>
              ) : null}
            </View>

            {reminder.description ? (
              <Text
                style={[styles.description, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}
                numberOfLines={2}
              >
                {reminder.description}
              </Text>
            ) : null}

            <View style={[styles.metaRow, isMobile && styles.metaRowMobile]}>
              {/* Nível de alarme */}
              <View style={[styles.metaItem, styles.alarmLevelBadge, { backgroundColor: alarmLevelMeta.bg }]}>
                <IconSymbol name={alarmLevelMeta.icon as any} size={11} color={alarmLevelMeta.color} />
                <Text style={[styles.alarmLevelText, { color: alarmLevelMeta.color, fontSize: scaledFont(10, width) }]}>
                  {alarmLevelMeta.label}
                </Text>
              </View>
              {reminder.schedule?.title ? (
                <View style={styles.metaItem}>
                  <IconSymbol name="format-list-checks" size={13} color={theme.textSoft} />
                  <Text style={[styles.metaText, { color: theme.textMuted, fontSize: scaledFont(11, width) }]} numberOfLines={1}>
                    {reminder.schedule.title}
                  </Text>
                </View>
              ) : null}
              {reminder.location ? (
                <View style={styles.metaItem}>
                  <IconSymbol name="map-marker-outline" size={13} color={theme.textSoft} />
                  <Text style={[styles.metaText, { color: theme.textMuted, fontSize: scaledFont(11, width) }]} numberOfLines={1}>
                    {reminder.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Priority Badge */}
          {!isMobile && (
            <View style={[styles.priorityBadge, { backgroundColor: priority.background, borderColor: priority.border }]}>
              <Text style={[styles.priorityText, { color: priority.color, fontSize: scaledFont(11, width) }]}>
                {priority.label}
              </Text>
            </View>
          )}
        </View>

        {/* Priority Badge for Mobile */}
        {isMobile && (
          <View style={styles.priorityRowMobile}>
            <View style={[styles.priorityBadgeMobile, { backgroundColor: priority.background, borderColor: priority.border }]}>
              <Text style={[styles.priorityText, { color: priority.color, fontSize: scaledFont(10, width) }]}>
                {priority.label}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {reminder.notes ? (
          <View style={[styles.notesBox, { backgroundColor: theme.surfaceMuted }, isMobile && styles.notesBoxMobile]}>
            <Text
              style={[styles.notesText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}
              numberOfLines={onOpenDetails ? 2 : undefined}
            >
              {reminder.notes}
            </Text>
          </View>
        ) : null}

        {overdue ? (
          <View style={styles.overdueBox}>
            <Text style={[styles.overdueText, { fontSize: scaledFont(12, width) }]}>
              {overdueLabel}
            </Text>
          </View>
        ) : null}

        {onOpenDetails ? (
          <Pressable
            onPress={(event) => runCardAction(event, onOpenDetails)}
            style={[styles.detailsButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
          >
            <IconSymbol name="text-box-search-outline" size={15} color={theme.primary} />
            <Text style={[styles.detailsButtonText, { color: theme.primary, fontSize: scaledFont(12, width) }]}>
              Ver detalhes
            </Text>
          </Pressable>
        ) : null}

        {/* Actions */}
        <View style={[styles.actions, isMobile && styles.actionsMobile]}>
          <Pressable
            disabled={done}
            onPress={(event) => runCardAction(event, onDone)}
            style={[styles.actionButton, styles.doneButton, done && styles.actionDisabled, isMobile && styles.actionButtonMobile]}
          >
            <IconSymbol
              name={done ? "check-decagram" : "check"}
              size={14}
              color={colors.success}
            />
            <Text style={[styles.actionText, styles.doneText, { fontSize: scaledFont(12, width) }]}>
              {done ? "Concluido" : "Marcar feito"}
            </Text>
          </Pressable>
          <Pressable
            disabled={done || skipped}
            onPress={(event) => runCardAction(event, onSnooze)}
            style={[styles.actionButton, styles.snoozeButton, isMobile && styles.actionButtonMobile]}
          >
            <IconSymbol name="clock-plus-outline" size={14} color={colors.warning} />
            <Text style={[styles.actionText, styles.snoozeText, { fontSize: scaledFont(12, width) }]}>Adiar</Text>
          </Pressable>
          {overdue && onReplan ? (
            <Pressable
              onPress={(event) => runCardAction(event, onReplan)}
              style={[styles.actionButton, styles.replanButton, isMobile && styles.actionButtonMobile]}
            >
              <IconSymbol name="auto-fix" size={14} color={colors.accent} />
              <Text style={[styles.actionText, styles.replanText, { fontSize: scaledFont(12, width) }]}>Replanejar</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={done || skipped}
              onPress={(event) => runCardAction(event, onSkip)}
              style={[styles.actionButton, styles.skipButton, isMobile && styles.actionButtonMobile]}
            >
              <IconSymbol
                name="skip-next-outline"
                size={14}
                color={colors.danger}
              />
              <Text style={[styles.actionText, styles.skipText, { fontSize: scaledFont(12, width) }]}>
                {skipped ? "Pulado" : "Pular"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default ReminderCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadow.soft
  },
  cardDone: {
    opacity: 0.72
  },
  cardOverdue: {
    borderColor: "#FECDD6",
    backgroundColor: "#FFF7F8"
  },
  cardMobile: {
    borderRadius: radius.lg
  },

  leftRail: {
    width: 90,
    alignItems: "center",
    paddingTop: spacing.lg
  },
  leftRailMobile: {
    width: 70
  },

  timePill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1
  },

  timeText: {
    fontFamily: fonts.bold
  },

  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.md
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xs
  },

  content: {
    flex: 1,
    padding: spacing.lg,
    paddingLeft: 0
  },
  contentMobile: {
    padding: spacing.md,
    paddingLeft: spacing.sm
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  headerRowMobile: {
    gap: spacing.sm
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  iconBoxMobile: {
    width: 44,
    height: 44,
    borderRadius: 14
  },

  iconText: {
    fontFamily: fonts.title
  },

  titleArea: {
    flex: 1,
    minWidth: 0
  },

  timeBadgeMobile: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs
  },

  timeBadgeMobileText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap"
  },

  title: {
    color: colors.text,
    fontFamily: fonts.title,
    flex: 1,
    minWidth: 0
  },

  description: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 19,
    marginTop: 4
  },

  categoryBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },

  categoryText: {
    fontFamily: fonts.bold
  },

  overdueBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },

  overdueBadgeText: {
    color: colors.danger,
    fontFamily: fonts.bold
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm
  },
  metaRowMobile: {
    gap: spacing.sm
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },

  metaIcon: {
    color: colors.textSoft,
    fontFamily: fonts.bold
  },

  metaText: {
    color: colors.textMuted,
    fontFamily: fonts.medium
  },

  priorityBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start"
  },

  priorityRowMobile: {
    marginTop: spacing.sm
  },

  priorityBadgeMobile: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start"
  },

  priorityText: {
    fontFamily: fonts.bold
  },

  notesBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md
  },
  notesBoxMobile: {
    padding: spacing.sm
  },

  notesText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 19
  },

  overdueBox: {
    alignSelf: "flex-start",
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md
  },

  overdueText: {
    color: colors.danger,
    fontFamily: fonts.bold
  },
  detailsButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md
  },
  detailsButtonText: {
    fontFamily: fonts.bold
  },

  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionsMobile: {
    flexWrap: "wrap"
  },

  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 80
  },
  actionButtonMobile: {
    height: 36,
    minWidth: 70
  },

  doneButton: {
    backgroundColor: colors.successSoft
  },

  snoozeButton: {
    backgroundColor: colors.warningSoft
  },

  skipButton: {
    backgroundColor: colors.dangerSoft
  },

  replanButton: {
    backgroundColor: colors.accentSoft
  },

  actionText: {
    fontFamily: fonts.bold
  },

  doneText: {
    color: colors.success
  },

  snoozeText: {
    color: colors.warning
  },

  skipText: {
    color: colors.danger
  },

  replanText: {
    color: colors.accent
  },

  actionDisabled: {
    opacity: 0.6
  },

  alarmLevelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },

  alarmLevelText: {
    fontFamily: fonts.bold
  }
});
