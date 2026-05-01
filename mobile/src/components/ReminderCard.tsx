import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Reminder } from "../types/entities";
import { colors, getCategoryMeta, radius, spacing } from "../theme";
import { formatTime } from "../utils/date";

function getLastAction(reminder: Reminder) {
  return reminder.logs?.[0]?.action || null;
}

function getActionMeta(action: string | null) {
  if (action === "DONE") return { label: "Feito", color: colors.success, soft: colors.successSoft };
  if (action === "SNOOZED") return { label: "Adiado", color: colors.warning, soft: colors.warningSoft };
  if (action === "SKIPPED") return { label: "Pulado", color: colors.danger, soft: colors.dangerSoft };
  if (action === "MISSED") return { label: "Perdido", color: colors.textMuted, soft: colors.surfaceMuted };
  return { label: "Pendente", color: colors.primary, soft: colors.primarySoft };
}

export function ReminderCard({
  reminder,
  onDone,
  onSnooze,
  onSkip
}: {
  reminder: Reminder;
  onDone?: () => void;
  onSnooze?: () => void;
  onSkip?: () => void;
}) {
  const category = getCategoryMeta(reminder.schedule?.category);
  const action = getActionMeta(getLastAction(reminder));

  return (
    <View style={styles.card}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: category.color }]} />
        <View style={styles.line} />
      </View>

      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.timeBadge}><Text style={styles.timeText}>{formatTime(reminder.startAt)}</Text></View>
          <View style={[styles.status, { backgroundColor: action.soft }]}>
            <Text style={[styles.statusText, { color: action.color }]}>{action.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{reminder.title}</Text>
        {reminder.description ? <Text style={styles.description} numberOfLines={3}>{reminder.description}</Text> : null}

        <View style={styles.metaRow}>
          <View style={[styles.category, { backgroundColor: category.soft }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
          </View>
          {reminder.schedule?.title ? <Text style={styles.scheduleName} numberOfLines={1}>{reminder.schedule.title}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.done]} onPress={onDone}>
            <Text style={[styles.actionText, { color: colors.success }]}>Feito</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.snooze]} onPress={onSnooze}>
            <Text style={[styles.actionText, { color: colors.warning }]}>Adiar</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.skip]} onPress={onSkip}>
            <Text style={[styles.actionText, { color: colors.danger }]}>Pular</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", marginBottom: spacing.md },
  timeline: { width: 26, alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 999, marginTop: 24 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 6 },
  content: { flex: 1, backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.md },
  timeBadge: { backgroundColor: colors.dark, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  timeText: { color: colors.white, fontWeight: "900", fontSize: 13 },
  status: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusText: { fontWeight: "900", fontSize: 12 },
  title: { color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 24 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  category: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: 999, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  categoryIcon: { fontSize: 13 },
  categoryText: { fontWeight: "900", fontSize: 12 },
  scheduleName: { flex: 1, color: colors.textSoft, fontWeight: "800", fontSize: 12 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  actionButton: { flex: 1, minHeight: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  done: { backgroundColor: colors.successSoft },
  snooze: { backgroundColor: colors.warningSoft },
  skip: { backgroundColor: colors.dangerSoft },
  actionText: { fontWeight: "900", fontSize: 13 }
});
