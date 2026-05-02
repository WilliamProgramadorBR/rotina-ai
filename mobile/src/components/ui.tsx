import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from "react-native";
import { colors, fonts, radius, shadow, spacing } from "../theme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  style?: ViewStyle;
};

export function Button({ title, onPress, loading, disabled, variant = "primary", style }: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && !isDisabled && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.6 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{title}</Text>
      )}
    </Pressable>
  );
}

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export function Input({ label, hint, style, multiline, right, containerStyle, ...props }: InputProps) {
  return (
    <View style={[styles.inputBlock, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, multiline && styles.inputShellMultiline]}>
        <TextInput
          placeholderTextColor={colors.textSoft}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...props}
        />
        {right ? <View style={styles.inputRight}>{right}</View> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon = "—", title, description, action }: { icon?: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>{icon}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function StatCard({ title, value, icon, tone = "blue", caption }: { title: string; value: number | string; icon?: string; tone?: "blue" | "green" | "orange" | "violet"; caption?: string }) {
  const toneStyle =
    tone === "green" ? styles.statIconGreen : tone === "orange" ? styles.statIconOrange : tone === "violet" ? styles.statIconViolet : styles.statIconBlue;

  return (
    <Card style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, toneStyle]}>
          <Text style={styles.statIconText}>{icon || "•"}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>Hoje</Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {caption ? <Text style={styles.statCaption}>{caption}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  button_primary: { backgroundColor: colors.primary, ...shadow.soft },
  button_ai: { backgroundColor: colors.accent, ...shadow.glow },
  button_secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button_ghost: { backgroundColor: "transparent" },
  button_danger: { backgroundColor: colors.danger },
  buttonText: { fontFamily: fonts.bold, fontSize: 15 },
  buttonText_primary: { color: colors.white },
  buttonText_ai: { color: colors.white },
  buttonText_secondary: { color: colors.text },
  buttonText_ghost: { color: colors.primary },
  buttonText_danger: { color: colors.white },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft
  },

  inputBlock: { marginBottom: spacing.lg },
  label: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, marginBottom: spacing.sm },
  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden"
  },
  inputShellMultiline: { minHeight: 112, alignItems: "flex-start" },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15
  },
  inputMultiline: { minHeight: 110, paddingTop: spacing.md, paddingBottom: spacing.md, lineHeight: 22 },
  inputRight: { paddingRight: spacing.md, alignSelf: "center" },
  hint: { marginTop: spacing.xs, color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },

  sectionTitleBlock: { marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontFamily: fonts.title, fontSize: 20 },
  sectionSubtitle: { color: colors.textMuted, fontFamily: fonts.regular, marginTop: spacing.xs, lineHeight: 20 },

  chip: {
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  chipTextActive: { color: colors.white },

  empty: { alignItems: "center", padding: spacing.xl },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  emptyIcon: { fontSize: 28 },
  emptyTitle: { fontFamily: fonts.title, color: colors.text, fontSize: 20, textAlign: "center" },
  emptyDescription: { fontFamily: fonts.regular, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 21 },

  loading: { alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontFamily: fonts.medium },

  statCard: { flex: 1, minHeight: 120, padding: spacing.lg },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  statIcon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statIconText: { fontSize: 18 },
  statIconBlue: { backgroundColor: colors.primarySoft },
  statIconGreen: { backgroundColor: colors.successSoft },
  statIconOrange: { backgroundColor: colors.warningSoft },
  statIconViolet: { backgroundColor: colors.accentSoft },
  statBadge: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statBadgeText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 10 },
  statValue: { color: colors.text, fontFamily: fonts.title, fontSize: 26, marginTop: spacing.xs },
  statTitle: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
  statCaption: { color: colors.textSoft, fontFamily: fonts.regular, fontSize: 12, marginTop: spacing.xs }
});
