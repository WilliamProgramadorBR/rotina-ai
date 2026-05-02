import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors, fonts, getCategoryMeta, getPriorityMeta, radius, shadow, spacing, scaledFont } from "../theme";
import { useResponsive } from "../hooks/useResponsive";

type ReminderLike = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  startAt: string;
  priority?: string | null;
  location?: string | null;
  schedule?: {
    title?: string | null;
    category?: string | null;
  } | null;
  logs?: Array<{ action: string }>;
};

type ReminderCardProps = {
  reminder: ReminderLike;
  onDone?: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function hasAction(reminder: ReminderLike, action: string) {
  return reminder.logs?.some((log) => log.action === action);
}

export function ReminderCard({ reminder, onDone, onSnooze, onSkip }: ReminderCardProps) {
  const { width, isPhone, isSmallPhone } = useResponsive();
  const category = getCategoryMeta(reminder.schedule?.category);
  const priority = getPriorityMeta(reminder.priority || "NORMAL");
  const done = hasAction(reminder, "DONE");
  const skipped = hasAction(reminder, "SKIPPED");

  const isMobile = isPhone || isSmallPhone;

  return (
    <View style={[styles.card, done && styles.cardDone, isMobile && styles.cardMobile]}>
      {/* Time Rail - Hidden on very small screens */}
      {!isSmallPhone && (
        <View style={[styles.leftRail, isMobile && styles.leftRailMobile]}>
          <View style={[styles.timePill, { backgroundColor: category.background, borderColor: category.border }]}>
            <Text style={[styles.timeText, { color: category.color, fontSize: scaledFont(12, width) }]}>
              {formatTime(reminder.startAt)}
            </Text>
          </View>
          <View style={[styles.timelineDot, { backgroundColor: category.color }]} />
          <View style={styles.timelineLine} />
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
            <Text style={[styles.iconText, { color: category.color, fontSize: scaledFont(isMobile ? 18 : 22, width) }]}>
              {category.icon}
            </Text>
          </View>

          <View style={styles.titleArea}>
            {/* Time badge for mobile */}
            {isSmallPhone && (
              <View style={[styles.timeBadgeMobile, { backgroundColor: category.background }]}>
                <Text style={[styles.timeBadgeMobileText, { color: category.color }]}>
                  {formatTime(reminder.startAt)}
                </Text>
              </View>
            )}
            
            <View style={styles.titleRow}>
              <Text 
                style={[styles.title, { fontSize: scaledFont(isMobile ? 15 : 17, width) }]} 
                numberOfLines={1}
              >
                {reminder.title}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: category.background }]}>
                <Text style={[styles.categoryText, { color: category.color, fontSize: scaledFont(11, width) }]}>
                  {category.label}
                </Text>
              </View>
            </View>

            {reminder.description ? (
              <Text 
                style={[styles.description, { fontSize: scaledFont(13, width) }]} 
                numberOfLines={2}
              >
                {reminder.description}
              </Text>
            ) : null}

            <View style={[styles.metaRow, isMobile && styles.metaRowMobile]}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaIcon, { fontSize: scaledFont(11, width) }]}>T</Text>
                <Text style={[styles.metaText, { fontSize: scaledFont(11, width) }]}>30 min</Text>
              </View>
              {reminder.schedule?.title ? (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaIcon, { fontSize: scaledFont(11, width) }]}>C</Text>
                  <Text style={[styles.metaText, { fontSize: scaledFont(11, width) }]} numberOfLines={1}>
                    {reminder.schedule.title}
                  </Text>
                </View>
              ) : null}
              {reminder.location ? (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaIcon, { fontSize: scaledFont(11, width) }]}>L</Text>
                  <Text style={[styles.metaText, { fontSize: scaledFont(11, width) }]} numberOfLines={1}>
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
          <View style={[styles.notesBox, isMobile && styles.notesBoxMobile]}>
            <Text style={[styles.notesText, { fontSize: scaledFont(13, width) }]}>{reminder.notes}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={[styles.actions, isMobile && styles.actionsMobile]}>
          <Pressable 
            disabled={done} 
            onPress={onDone} 
            style={[styles.actionButton, styles.doneButton, done && styles.actionDisabled, isMobile && styles.actionButtonMobile]}
          >
            <Text style={[styles.actionText, styles.doneText, { fontSize: scaledFont(12, width) }]}>
              {done ? "Concluido" : "Marcar feito"}
            </Text>
          </Pressable>
          <Pressable 
            disabled={done || skipped} 
            onPress={onSnooze} 
            style={[styles.actionButton, styles.snoozeButton, isMobile && styles.actionButtonMobile]}
          >
            <Text style={[styles.actionText, styles.snoozeText, { fontSize: scaledFont(12, width) }]}>Adiar</Text>
          </Pressable>
          <Pressable 
            disabled={done || skipped} 
            onPress={onSkip} 
            style={[styles.actionButton, styles.skipButton, isMobile && styles.actionButtonMobile]}
          >
            <Text style={[styles.actionText, styles.skipText, { fontSize: scaledFont(12, width) }]}>
              {skipped ? "Pulado" : "Pular"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
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
  
  actionDisabled: { 
    opacity: 0.6 
  }
});
