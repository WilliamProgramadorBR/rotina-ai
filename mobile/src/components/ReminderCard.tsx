import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, getCategoryMeta, getPriorityMeta, radius, shadow, spacing } from "../theme";

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
  const category = getCategoryMeta(reminder.schedule?.category);
  const priority = getPriorityMeta(reminder.priority || "NORMAL");
  const done = hasAction(reminder, "DONE");
  const skipped = hasAction(reminder, "SKIPPED");

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <View style={styles.leftRail}>
        <View style={[styles.timePill, { backgroundColor: category.background, borderColor: category.border }]}>
          <Text style={[styles.timeText, { color: category.color }]}>{formatTime(reminder.startAt)}</Text>
        </View>
        <View style={[styles.timelineDot, { backgroundColor: category.color }]} />
        <View style={styles.timelineLine} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: category.background, borderColor: category.border }]}>
            <Text style={[styles.iconText, { color: category.color }]}>{category.icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{reminder.title}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: category.background }]}>
                <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
              </View>
            </View>

            {reminder.description ? <Text style={styles.description} numberOfLines={2}>{reminder.description}</Text> : null}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>◷ 30 min</Text>
              {reminder.schedule?.title ? <Text style={styles.metaText}>□ {reminder.schedule.title}</Text> : null}
              {reminder.location ? <Text style={styles.metaText}>⌖ {reminder.location}</Text> : null}
            </View>
          </View>

          <View style={[styles.priorityBadge, { backgroundColor: priority.background, borderColor: priority.border }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        </View>

        {reminder.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{reminder.notes}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable disabled={done} onPress={onDone} style={[styles.actionButton, styles.doneButton, done && styles.actionDisabled]}>
            <Text style={[styles.actionText, styles.doneText]}>{done ? "Concluído" : "Marcar como feito"}</Text>
          </Pressable>
          <Pressable disabled={done || skipped} onPress={onSnooze} style={[styles.actionButton, styles.snoozeButton]}>
            <Text style={[styles.actionText, styles.snoozeText]}>Adiar</Text>
          </Pressable>
          <Pressable disabled={done || skipped} onPress={onSkip} style={[styles.actionButton, styles.skipButton]}>
            <Text style={[styles.actionText, styles.skipText]}>{skipped ? "Pulado" : "Pular"}</Text>
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
  cardDone: { opacity: 0.72 },
  leftRail: { width: 104, alignItems: "center", paddingTop: spacing.lg },
  timePill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1 },
  timeText: { fontFamily: fonts.bold, fontSize: 13 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: spacing.md },
  timelineLine: { width: 1, flex: 1, backgroundColor: colors.border, marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.lg, paddingLeft: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconBox: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  iconText: { fontFamily: fonts.title, fontSize: 24 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 18, maxWidth: "72%" },
  description: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 20, marginTop: 4 },
  categoryBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  categoryText: { fontFamily: fonts.bold, fontSize: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.sm },
  metaText: { color: colors.slate600 ?? colors.textMuted, fontFamily: fonts.medium, fontSize: 12 },
  priorityBadge: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignSelf: "flex-start" },
  priorityText: { fontFamily: fonts.bold, fontSize: 12 },
  notesBox: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  notesText: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 19 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  actionButton: { flex: 1, height: 42, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  doneButton: { backgroundColor: colors.successSoft },
  snoozeButton: { backgroundColor: colors.warningSoft },
  skipButton: { backgroundColor: colors.dangerSoft },
  actionText: { fontFamily: fonts.bold, fontSize: 13 },
  doneText: { color: colors.success },
  snoozeText: { color: colors.warning },
  skipText: { color: colors.danger },
  actionDisabled: { opacity: 0.6 }
});
