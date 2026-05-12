import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import { colors, fonts, radius, shadow, spacing, typography, scaledFont } from "../theme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
};

export function Button({ 
  title, 
  onPress, 
  loading, 
  disabled, 
  variant = "primary", 
  size = "md",
  style,
  fullWidth = false
}: ButtonProps) {
  const { width } = useWindowDimensions();
  const isDisabled = Boolean(disabled || loading);
  
  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: spacing.md, fontSize: scaledFont(13, width) },
    md: { height: 48, paddingHorizontal: spacing.lg, fontSize: scaledFont(14, width) },
    lg: { height: 54, paddingHorizontal: spacing.xl, fontSize: scaledFont(15, width) },
  };
  
  const currentSize = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
        styles[`button_${variant}`],
        fullWidth && { width: "100%" },
        pressed && !isDisabled && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.6 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`], { fontSize: currentSize.fontSize }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  size?: "sm" | "md" | "lg";
};

export function Input({ 
  label, 
  hint, 
  error,
  style, 
  multiline, 
  right, 
  left,
  containerStyle,
  size = "md",
  ...props 
}: InputProps) {
  const { width } = useWindowDimensions();
  const isSmall = width <= 360;
  
  const sizeStyles = {
    sm: { height: 44, fontSize: scaledFont(14, width) },
    md: { height: 50, fontSize: scaledFont(15, width) },
    lg: { height: 56, fontSize: scaledFont(16, width) },
  };
  
  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.inputBlock, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { fontSize: scaledFont(13, width) }]}>{label}</Text>
      ) : null}
      <View style={[
        styles.inputShell, 
        { minHeight: multiline ? 100 : currentSize.height },
        multiline && styles.inputShellMultiline,
        error && styles.inputShellError
      ]}>
        {left ? <View style={styles.inputLeft}>{left}</View> : null}
        <TextInput
          placeholderTextColor={colors.textSoft}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input, 
            { fontSize: currentSize.fontSize },
            multiline && styles.inputMultiline, 
            isSmall && { paddingHorizontal: spacing.md },
            style
          ]}
          {...props}
        />
        {right ? <View style={styles.inputRight}>{right}</View> : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, { fontSize: scaledFont(12, width) }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { fontSize: scaledFont(12, width) }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "elevated" | "outlined" | "tech";
};

export function Card({ children, style, variant = "default" }: CardProps) {
  const variantStyles = {
    default: styles.card,
    elevated: [styles.card, styles.cardElevated],
    outlined: [styles.card, styles.cardOutlined],
    tech: [styles.card, styles.cardTech],
  };

  return (
    <View style={[variantStyles[variant], style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { width } = useWindowDimensions();
  
  return (
    <View style={styles.sectionTitleBlock}>
      <Text style={[styles.sectionTitle, { fontSize: scaledFont(18, width) }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSubtitle, { fontSize: scaledFont(14, width) }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function Chip({ 
  label, 
  active, 
  onPress,
  size = "md" 
}: { 
  label: string; 
  active?: boolean; 
  onPress?: () => void;
  size?: "sm" | "md";
}) {
  const { width } = useWindowDimensions();
  const isSmall = width <= 360;
  
  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.chip, 
        active && styles.chipActive,
        size === "sm" && styles.chipSmall,
        isSmall && styles.chipCompact
      ]}
    >
      <Text style={[
        styles.chipText, 
        active && styles.chipTextActive,
        { fontSize: scaledFont(size === "sm" ? 12 : 13, width) }
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ 
  icon = "—", 
  title, 
  description, 
  action 
}: { 
  icon?: string; 
  title: string; 
  description: string; 
  action?: React.ReactNode 
}) {
  const { width } = useWindowDimensions();
  
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>{icon}</Text>
      </View>
      <Text style={[styles.emptyTitle, { fontSize: scaledFont(18, width) }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { fontSize: scaledFont(14, width) }]}>{description}</Text>
      {action ? <View style={{ marginTop: spacing.lg, width: "100%" }}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  
  return (
    <View style={styles.loading}>
      <View style={styles.loadingSpinner}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={[styles.loadingText, { fontSize: scaledFont(14, width) }]}>{label}</Text>
    </View>
  );
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  tone = "blue", 
  caption 
}: { 
  title: string; 
  value: number | string; 
  icon?: string; 
  tone?: "blue" | "green" | "orange" | "violet"; 
  caption?: string 
}) {
  const { width } = useWindowDimensions();
  const isSmall = width <= 360;
  
  const toneStyle =
    tone === "green" ? styles.statIconGreen 
    : tone === "orange" ? styles.statIconOrange 
    : tone === "violet" ? styles.statIconViolet 
    : styles.statIconBlue;

  return (
    <Card style={[styles.statCard, isSmall && styles.statCardCompact]}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, toneStyle, isSmall && styles.statIconSmall]}>
          <Text style={[styles.statIconText, { fontSize: scaledFont(16, width) }]}>{icon || "•"}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={[styles.statBadgeText, { fontSize: scaledFont(10, width) }]}>Hoje</Text>
        </View>
      </View>
      <Text style={[styles.statValue, { fontSize: scaledFont(isSmall ? 22 : 26, width) }]}>{value}</Text>
      <Text style={[styles.statTitle, { fontSize: scaledFont(12, width) }]}>{title}</Text>
      {caption ? (
        <Text style={[styles.statCaption, { fontSize: scaledFont(11, width) }]}>{caption}</Text>
      ) : null}
    </Card>
  );
}

// Componente de Divider
export function Divider({ 
  text, 
  style 
}: { 
  text?: string; 
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.dividerRow, style]}>
      <View style={styles.divider} />
      {text ? <Text style={styles.dividerText}>{text}</Text> : null}
      {text ? <View style={styles.divider} /> : null}
    </View>
  );
}

// Componente de Badge
export function Badge({ 
  text, 
  variant = "default" 
}: { 
  text: string; 
  variant?: "default" | "success" | "warning" | "danger" | "tech" 
}) {
  const { width } = useWindowDimensions();
  const variantStyles = {
    default: { bg: colors.primarySoft, text: colors.primary },
    success: { bg: colors.successSoft, text: colors.success },
    warning: { bg: colors.warningSoft, text: colors.warning },
    danger: { bg: colors.dangerSoft, text: colors.danger },
    tech: { bg: "rgba(79,124,255,0.15)", text: "#60A5FA" },
  };
  
  const current = variantStyles[variant];
  
  return (
    <View style={[styles.badge, { backgroundColor: current.bg }]}>
      <Text style={[styles.badgeText, { color: current.text, fontSize: scaledFont(11, width) }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  button_primary: { backgroundColor: colors.primary, ...shadow.soft },
  button_ai: { 
    backgroundColor: colors.accent, 
    ...shadow.glow 
  },
  button_secondary: { 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  button_ghost: { backgroundColor: "transparent" },
  button_danger: { backgroundColor: colors.danger },
  buttonText: { fontFamily: fonts.bold },
  buttonText_primary: { color: colors.white },
  buttonText_ai: { color: colors.white },
  buttonText_secondary: { color: colors.text },
  buttonText_ghost: { color: colors.primary },
  buttonText_danger: { color: colors.white },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft
  },
  cardElevated: {
    ...shadow.medium
  },
  cardOutlined: {
    backgroundColor: "transparent",
    borderWidth: 1.5
  },
  cardTech: {
    backgroundColor: "rgba(17, 26, 46, 0.95)",
    borderColor: "rgba(79, 124, 255, 0.2)",
    ...shadow.glow
  },

  // Input styles
  inputBlock: { marginBottom: spacing.lg },
  label: { 
    color: colors.text, 
    fontFamily: fonts.bold, 
    marginBottom: spacing.sm 
  },
  inputShell: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden"
  },
  inputShellMultiline: { alignItems: "flex-start" },
  inputShellError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.regular
  },
  inputMultiline: { 
    paddingTop: spacing.md, 
    paddingBottom: spacing.md, 
    lineHeight: 22,
    minHeight: 96
  },
  inputLeft: { paddingLeft: spacing.md, alignSelf: "center" },
  inputRight: { paddingRight: spacing.md, alignSelf: "center" },
  hint: { 
    marginTop: spacing.xs, 
    color: colors.textMuted, 
    fontFamily: fonts.regular 
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontFamily: fonts.medium
  },

  // Section title
  sectionTitleBlock: { marginBottom: spacing.md },
  sectionTitle: { 
    color: colors.text, 
    fontFamily: fonts.title 
  },
  sectionSubtitle: { 
    color: colors.textMuted, 
    fontFamily: fonts.regular, 
    marginTop: spacing.xs, 
    lineHeight: 20 
  },

  // Chip styles
  chip: {
    height: 38,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  chipSmall: {
    height: 32,
    paddingHorizontal: spacing.md
  },
  chipCompact: {
    paddingHorizontal: spacing.md
  },
  chipActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  chipText: { 
    color: colors.textMuted, 
    fontFamily: fonts.bold 
  },
  chipTextActive: { color: colors.white },

  // Empty state
  empty: { 
    alignItems: "center", 
    padding: spacing.xl 
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { 
    fontFamily: fonts.title, 
    color: colors.text, 
    textAlign: "center" 
  },
  emptyDescription: { 
    fontFamily: fonts.regular, 
    color: colors.textMuted, 
    textAlign: "center", 
    marginTop: spacing.sm, 
    lineHeight: 21 
  },

  // Loading state
  loading: { 
    alignItems: "center", 
    justifyContent: "center", 
    padding: spacing.xxl 
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  loadingText: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium 
  },

  // Stat card
  statCard: { 
    flex: 1, 
    minHeight: 110, 
    padding: spacing.md 
  },
  statCardCompact: {
    padding: spacing.sm,
    minHeight: 100
  },
  statTop: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: spacing.xs 
  },
  statIcon: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  statIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 10
  },
  statIconText: { fontFamily: fonts.bold },
  statIconBlue: { backgroundColor: colors.primarySoft },
  statIconGreen: { backgroundColor: colors.successSoft },
  statIconOrange: { backgroundColor: colors.warningSoft },
  statIconViolet: { backgroundColor: colors.accentSoft },
  statBadge: { 
    backgroundColor: colors.surfaceMuted, 
    borderRadius: radius.pill, 
    paddingHorizontal: spacing.sm, 
    paddingVertical: 2 
  },
  statBadgeText: { 
    color: colors.textMuted, 
    fontFamily: fonts.bold 
  },
  statValue: { 
    color: colors.text, 
    fontFamily: fonts.title, 
    marginTop: spacing.xs 
  },
  statTitle: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium, 
    marginTop: 2 
  },
  statCaption: { 
    color: colors.textSoft, 
    fontFamily: fonts.regular, 
    marginTop: spacing.xs 
  },

  // Divider
  dividerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: spacing.md, 
    marginVertical: spacing.lg 
  },
  divider: { 
    flex: 1, 
    height: 1, 
    backgroundColor: colors.border 
  },
  dividerText: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium,
    fontSize: 13
  },

  // Badge
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: "flex-start"
  },
  badgeText: {
    fontFamily: fonts.bold
  }
});
