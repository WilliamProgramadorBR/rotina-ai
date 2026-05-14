import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { colors, fonts, getCategoryMeta, radius, shadow, spacing, scaledFont } from "../theme";
import { useResponsive } from "../hooks/useResponsive";
import { IconSymbol } from "./IconSymbol";
import { useThemeMode } from "../context/ThemeContext";
import {
  countOverdueReminders,
  formatOverdueLabel,
  isReminderOverdue
} from "../utils/reminderStatus";

type ScheduleCardProps = {
  schedule: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    sourceType?: string | null;
    reminders?: Array<{
      id: string;
      startAt?: string;
      status?: string | null;
      logs?: Array<{ action: string; createdAt?: string | Date | null }>;
    }>;
    progress?: {
      total: number;
      done: number;
      completionRate: number;
    };
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

  if (!next) return "Sem proximos alarmes";

  return next.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
  const { width, isPhone, isSmallPhone, isPhoneLarge } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const meta = getCategoryMeta(schedule.category);
  const remindersCount = schedule.reminders?.length || 0;
  const overdueCount = countOverdueReminders(schedule.reminders || []);
  const firstOverdue = (schedule.reminders || []).find((reminder) => isReminderOverdue(reminder));
  const completionRate = schedule.progress?.completionRate ?? 0;
  const progressLabel = `${completionRate}%`;

  const isMobile = isPhone || isSmallPhone;
  const isCompact = isMobile || isPhoneLarge;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        overdueCount > 0 && styles.cardOverdue,
        overdueCount > 0 && { backgroundColor: isDark ? "#2A1626" : theme.dangerSoft, borderColor: "#FECDD6" },
        pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] },
        isMobile && styles.cardMobile
      ]}
      onPress={() => router.push(`/schedules/${schedule.id}` as any)}
    >
      {/* Icon */}
      <View style={[
        styles.iconBox,
        { backgroundColor: meta.background, borderColor: meta.border },
        isMobile && styles.iconBoxMobile
      ]}>
        <IconSymbol name={meta.iconName} size={isMobile ? 22 : 26} color={meta.color} />
      </View>

      {/* Main Content */}
      <View style={[styles.main, isMobile && styles.mainMobile]}>
        <View style={[styles.badge, { backgroundColor: meta.background }]}>
        <Text style={[styles.badgeText, { color: meta.color, fontSize: scaledFont(11, width) }]}>
            {meta.label}
          </Text>
        </View>
        {overdueCount > 0 ? (
          <View style={styles.overdueBadge}>
            <Text style={[styles.overdueBadgeText, { fontSize: scaledFont(11, width) }]}>
              {overdueCount} {overdueCount === 1 ? "atrasado" : "atrasados"}
            </Text>
          </View>
        ) : null}

        <Text
          style={[styles.title, { color: theme.text, fontSize: scaledFont(isMobile ? 16 : 18, width) }]}
          numberOfLines={1}
        >
          {schedule.title}
        </Text>
        <Text
          style={[styles.description, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}
          numberOfLines={2}
        >
          {schedule.description || "Cronograma sem descricao adicionada."}
        </Text>
      </View>

      {/* Meta Info - Stacked on Mobile */}
      {!isCompact && (
        <>
          <View style={[styles.metaBlock, { borderLeftColor: theme.border }]}>
            <Text style={[styles.metaLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>Alarmes</Text>
            <Text style={[styles.metaValue, { color: theme.text, fontSize: scaledFont(14, width) }]}>{remindersCount}</Text>
          </View>

          <View style={[styles.metaBlockWide, { borderLeftColor: theme.border }]}>
            <Text style={[styles.metaLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>Proximo lembrete</Text>
            <Text style={[styles.metaValue, { color: theme.text }, overdueCount > 0 && styles.metaValueDanger, { fontSize: scaledFont(14, width) }]}>
              {overdueCount > 0 ? formatOverdueLabel(firstOverdue?.startAt) : getNextReminderLabel(schedule.reminders)}
            </Text>
          </View>

          <View style={styles.progressWrap}>
            <View style={[styles.progressRing, { borderColor: meta.color }]}>
              <Text style={[styles.progressText, { color: meta.color, fontSize: scaledFont(10, width) }]}>
                {progressLabel}
              </Text>
            </View>
            <Text style={[styles.metaLabel, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>Progresso</Text>
          </View>
        </>
      )}

      {/* Mobile Meta Row */}
      {isCompact && (
        <View style={styles.mobileMetaRow}>
          <View style={styles.mobileMetaItem}>
            <Text style={[styles.mobileMetaValue, { color: theme.text }, overdueCount > 0 && styles.metaValueDanger, { fontSize: scaledFont(14, width) }]}>
              {overdueCount > 0 ? overdueCount : remindersCount}
            </Text>
            <Text style={[styles.mobileMetaLabel, { color: theme.textMuted, fontSize: scaledFont(10, width) }]}>
              {overdueCount > 0 ? "Atrasados" : "Alarmes"}
            </Text>
          </View>

          <View style={[styles.progressRingMobile, { borderColor: meta.color }]}>
            <Text style={[styles.progressTextMobile, { color: meta.color, fontSize: scaledFont(9, width) }]}>
              {progressLabel}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actionsColumn, isMobile && styles.actionsColumnMobile]}>
        <Text style={[styles.openText, { color: theme.accent, fontSize: scaledFont(12, width) }]}>Abrir</Text>
        <IconSymbol name="chevron-right" size={20} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}

export default ScheduleCard;

const styles = StyleSheet.create({
  card: {
    minHeight: 110,
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
  cardMobile: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 100
  },
  cardOverdue: {
    borderColor: "#FECDD6",
    backgroundColor: "#FFF7F8"
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  iconBoxMobile: {
    width: 52,
    height: 52,
    borderRadius: 16
  },

  icon: {
    fontFamily: fonts.title
  },

  main: {
    flex: 1,
    minWidth: 180
  },
  mainMobile: {
    minWidth: 0,
    flex: 1
  },

  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs
  },

  badgeText: {
    fontFamily: fonts.bold
  },

  overdueBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs
  },

  overdueBadgeText: {
    color: colors.danger,
    fontFamily: fonts.bold
  },

  title: {
    color: colors.text,
    fontFamily: fonts.title
  },

  description: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 19,
    marginTop: 3
  },

  metaBlock: {
    minWidth: 70,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg
  },

  metaBlockWide: {
    minWidth: 140,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg
  },

  metaLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium
  },

  metaValue: {
    color: colors.text,
    fontFamily: fonts.bold,
    marginTop: 3
  },
  metaValueDanger: {
    color: colors.danger
  },

  progressWrap: {
    alignItems: "center",
    minWidth: 70
  },

  progressRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },

  progressText: {
    fontFamily: fonts.bold
  },

  // Mobile specific styles
  mobileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },

  mobileMetaItem: {
    alignItems: "center"
  },

  mobileMetaValue: {
    color: colors.text,
    fontFamily: fonts.bold
  },

  mobileMetaLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium
  },

  progressRingMobile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center"
  },

  progressTextMobile: {
    fontFamily: fonts.bold
  },

  actionsColumn: {
    alignItems: "center",
    gap: spacing.xs
  },
  actionsColumnMobile: {
    gap: spacing.xs
  },

  openText: {
    color: colors.accent,
    fontFamily: fonts.bold
  },

  more: {
    color: colors.textMuted,
    fontFamily: fonts.bold
  }
});
