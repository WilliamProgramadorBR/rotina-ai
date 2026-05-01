import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Schedule } from "../types/entities";
import { colors, getCategoryMeta, radius, shadows, spacing } from "../theme";

export function ScheduleCard({ schedule, onPress }: { schedule: Schedule; onPress?: () => void }) {
  const meta = getCategoryMeta(schedule.category);
  const remindersCount = schedule.reminders?.length || 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: meta.soft }]}><Text style={styles.icon}>{meta.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={1}>{schedule.title}</Text>
          <Text style={[styles.category, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{schedule.description || "Sem descrição adicionada."}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{remindersCount} {remindersCount === 1 ? "lembrete" : "lembretes"}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft
  },
  iconBox: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 24 },
  top: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, alignItems: "center" },
  title: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "900" },
  category: { fontSize: 12, fontWeight: "900" },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  footerText: { color: colors.textSoft, fontWeight: "800", fontSize: 12 },
  arrow: { color: colors.text, fontSize: 26, lineHeight: 26 }
});
