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
import { colors, radius, shadows, spacing } from "../theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      style={[
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        variant === "ghost" && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "secondary" && styles.buttonTextSecondary,
            variant === "ghost" && styles.buttonTextGhost
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Input({ label, multiline, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.textSoft}
        style={[styles.input, multiline && styles.inputMultiline, style]}
      />
    </View>
  );
}

export function EmptyState({
  icon = "✨",
  title,
  description,
  action
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function StatCard({
  title,
  value,
  icon,
  tone = "blue"
}: {
  title: string;
  value: string | number;
  icon: string;
  tone?: "blue" | "green" | "orange" | "purple";
}) {
  return (
    <View
      style={[
        styles.statCard,
        tone === "green" && { backgroundColor: colors.successSoft },
        tone === "orange" && { backgroundColor: colors.warningSoft },
        tone === "purple" && { backgroundColor: colors.purpleSoft }
      ]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    flexDirection: "row"
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderStrong },
  buttonDanger: { backgroundColor: colors.danger },
  buttonGhost: { backgroundColor: "transparent" },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  buttonTextSecondary: { color: colors.text },
  buttonTextGhost: { color: colors.primary },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft
  },
  label: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: spacing.sm },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: 16
  },
  inputMultiline: { minHeight: 130, paddingTop: spacing.md, textAlignVertical: "top" },
  empty: { alignItems: "center", paddingVertical: spacing.xxxl },
  emptyIcon: { fontSize: 38, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "900", textAlign: "center" },
  emptyDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: spacing.sm
  },
  loading: { flex: 1, minHeight: 280, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.textMuted, fontWeight: "700", marginTop: spacing.md },
  statCard: {
    flex: 1,
    minWidth: 98,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)"
  },
  statIcon: { fontSize: 22, marginBottom: spacing.sm },
  statValue: { fontSize: 23, fontWeight: "900", color: colors.text },
  statTitle: { fontSize: 12, color: colors.textMuted, fontWeight: "800", marginTop: spacing.xs }
});
