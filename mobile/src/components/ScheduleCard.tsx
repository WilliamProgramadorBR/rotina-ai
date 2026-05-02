import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fonts, getCategoryMeta, radius, shadow, spacing } from "../theme";

type ScheduleCardProps = {
  schedule: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    sourceType?: string | null;
    reminders?: Array<{ id: string; startAt?: string }>;
  };
};

function getNextReminderLabel(reminders?: Array<{ startAt?: string }>) {
  if (!reminders || reminders.length === 0) return "Sem lembretes";

  const now = Date.now();
  const next = reminders
    .filter((item) => item.startAt)
    .map((item) => new Date(item.startAt as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())
    .find((date) => date.getTime() >= now);

  if (!next) return "Sem próximos alarmes";

  return next.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
  const meta = getCategoryMeta(schedule.category);
  const remindersCount = schedule.reminders?.length || 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}
      onPress={() => router.push(`/schedules/${schedule.id}` as any)}
    >
      <View style={[styles.iconBox, { backgroundColor: meta.background, borderColor: meta.border }]}>
        <Text style={[styles.icon, { color: meta.color }]}>{meta.icon}</Text>
      </View>

      <View style={styles.main}>
        <View style={[styles.badge, { backgroundColor: meta.background }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>{schedule.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {schedule.description || "Cronograma sem descrição adicionada."}
        </Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>Alarmes</Text>
        <Text style={styles.metaValue}>{remindersCount}</Text>
      </View>

      <View style={styles.metaBlockWide}>
        <Text style={styles.metaLabel}>Próximo lembrete</Text>
        <Text style={styles.metaValue}>{getNextReminderLabel(schedule.reminders)}</Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressRing, { borderColor: meta.color }]}>
          <Text style={[styles.progressText, { color: meta.color }]}>{remindersCount ? "68%" : "0%"}</Text>
        </View>
        <Text style={styles.metaLabel}>Progresso</Text>
      </View>

      <Text style={styles.openText}>Abrir</Text>
      <Text style={styles.more}>⋮</Text>
    </Pressable>
  );
}

export default ScheduleCard;

const styles = StyleSheet.create({
  card: {
    minHeight: 126,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    ...shadow.soft
  },
  iconBox: { width: 72, height: 72, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  icon: { fontFamily: fonts.title, fontSize: 30 },
  main: { flex: 1.25, minWidth: 220 },
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, marginBottom: spacing.xs },
  badgeText: { fontFamily: fonts.bold, fontSize: 12 },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 20 },
  description: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 20, marginTop: 3 },
  metaBlock: { minWidth: 78, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: spacing.lg },
  metaBlockWide: { minWidth: 160, borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: spacing.lg },
  metaLabel: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12 },
  metaValue: { color: colors.text, fontFamily: fonts.bold, marginTop: 3 },
  progressWrap: { alignItems: "center", minWidth: 86 },
  progressRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 4, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  progressText: { fontFamily: fonts.bold, fontSize: 11 },
  openText: { color: colors.accent, fontFamily: fonts.bold, paddingHorizontal: spacing.md },
  more: { color: colors.textMuted, fontSize: 26, paddingHorizontal: spacing.xs }
});
