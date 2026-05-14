import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, radius, spacing } from "../theme";

type Reminder = {
  id: string;
  title: string;
  startAt: string;
  logs?: Array<{ action: string }>;
};

type Props = {
  userName: string;
  date: string;
  reminders: Reminder[];
  doneCount: number;
  totalCount: number;
  streakDays?: number;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isReminderDone(r: Reminder) {
  return r.logs?.some((l) => l.action === "DONE") ?? false;
}

const CARD_WIDTH = 360;

export const ShareRoutineCard = forwardRef<View, Props>(function ShareRoutineCard(
  { userName, date, reminders, doneCount, totalCount, streakDays = 0 },
  ref
) {
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const preview = reminders.slice(0, 6);
  const firstName = userName.split(" ")[0];

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      {/* Glow effects */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Header — branding */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>AI</Text>
        </View>
        <View>
          <Text style={styles.brandName}>Rotina AI</Text>
          <Text style={styles.brandSub}>Sua rotina em modo inteligente</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* User + date */}
      <View style={styles.userRow}>
        <Text style={styles.greeting}>Rotina de <Text style={styles.userName}>{firstName}</Text></Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{doneCount}/{totalCount}</Text>
          <Text style={styles.statLabel}>Feitas</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxMiddle]}>
          <Text style={[styles.statNum, { color: completionPct >= 80 ? "#34D399" : completionPct >= 50 ? "#FBBF24" : "#F87171" }]}>
            {completionPct}%
          </Text>
          <Text style={styles.statLabel}>Conclusão</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{streakDays}</Text>
          <Text style={styles.statLabel}>Dias 🔥</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${completionPct}%` as any,
          backgroundColor: completionPct >= 80 ? "#34D399" : completionPct >= 50 ? "#FBBF24" : "#60A5FA"
        }]} />
      </View>

      {/* Reminder list */}
      <View style={styles.list}>
        {preview.map((r) => {
          const done = isReminderDone(r);
          return (
            <View key={r.id} style={styles.row}>
              <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]} />
              <Text style={[styles.rowTitle, done && styles.rowTitleDone]} numberOfLines={1}>
                {r.title}
              </Text>
              <Text style={styles.rowTime}>{formatTime(r.startAt)}</Text>
            </View>
          );
        })}
        {reminders.length > 6 && (
          <Text style={styles.moreText}>+ {reminders.length - 6} mais atividades</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>rotina-ai.app  •  Organizado com IA</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#070B16",
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
    position: "relative"
  },

  glowTop: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1D4ED8",
    opacity: 0.18,
    top: -60,
    right: -40
  },
  glowBottom: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7C3AED",
    opacity: 0.14,
    bottom: -40,
    left: -30
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(79,124,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },
  logoText: {
    color: "#22D3EE",
    fontFamily: fonts.title,
    fontSize: 16
  },
  brandName: {
    color: "#F1F5F9",
    fontFamily: fonts.title,
    fontSize: 17
  },
  brandSub: {
    color: "#64748B",
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 1
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: spacing.lg
  },

  userRow: {
    marginBottom: spacing.md
  },
  greeting: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    fontSize: 13
  },
  userName: {
    color: "#F1F5F9",
    fontFamily: fonts.bold
  },
  dateText: {
    color: "#64748B",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2
  },

  statsRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)"
  },
  statBoxMiddle: {
    borderColor: "rgba(99,102,241,0.3)",
    backgroundColor: "rgba(99,102,241,0.08)"
  },
  statNum: {
    color: "#60A5FA",
    fontFamily: fonts.title,
    fontSize: 20
  },
  statLabel: {
    color: "#64748B",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2
  },

  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill
  },

  list: {
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  dotDone: {
    backgroundColor: "#34D399"
  },
  dotPending: {
    backgroundColor: "#60A5FA"
  },
  rowTitle: {
    flex: 1,
    color: "#CBD5E1",
    fontFamily: fonts.medium,
    fontSize: 13
  },
  rowTitleDone: {
    color: "#475569",
    textDecorationLine: "line-through"
  },
  rowTime: {
    color: "#475569",
    fontFamily: fonts.medium,
    fontSize: 11
  },
  moreText: {
    color: "#475569",
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: "center",
    paddingTop: spacing.xs
  },

  footer: {
    marginTop: spacing.sm
  },
  footerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: spacing.md
  },
  footerText: {
    color: "#334155",
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: "center"
  }
});
