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
import { useThemeMode } from "../context/ThemeContext";
import { IconSymbol, IconSymbolName } from "./IconSymbol";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  icon?: IconSymbolName | string;
};

export function Button({ 
  title, 
  onPress, 
  loading, 
  disabled, 
  variant = "primary", 
  size = "md",
  style,
  fullWidth = false,
  icon
}: ButtonProps) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  const isDisabled = Boolean(disabled || loading);
  
  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: spacing.md, fontSize: scaledFont(13, width) },
    md: { height: 48, paddingHorizontal: spacing.lg, fontSize: scaledFont(14, width) },
    lg: { height: 54, paddingHorizontal: spacing.xl, fontSize: scaledFont(15, width) },
  };
  
  const currentSize = sizeStyles[size];
  const variantStyle =
    variant === "ai"
      ? { backgroundColor: theme.accent, ...shadow.glow }
      : variant === "secondary"
      ? { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
      : variant === "ghost"
      ? { backgroundColor: "transparent" }
      : variant === "danger"
      ? { backgroundColor: theme.danger }
      : { backgroundColor: theme.primary, ...shadow.soft };
  const textColor =
    variant === "secondary" ? theme.text
    : variant === "ghost" ? theme.primary
    : theme.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
        variantStyle,
        fullWidth && { width: "100%" },
        pressed && !isDisabled && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.6 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.primary : colors.white} />
      ) : (
        <>
          {icon ? (
            <IconSymbol
              name={icon}
              size={size === "sm" ? 16 : 18}
              color={variant === "secondary" || variant === "ghost" ? theme.primary : theme.white}
            />
          ) : null}
          <Text style={[styles.buttonText, { color: textColor, fontSize: currentSize.fontSize }]}>
            {title}
          </Text>
        </>
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
  const { theme } = useThemeMode();
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
        <Text style={[styles.label, { color: theme.text, fontSize: scaledFont(13, width) }]}>{label}</Text>
      ) : null}
      <View style={[
        styles.inputShell, 
        { backgroundColor: theme.surface, borderColor: theme.borderStrong },
        { minHeight: multiline ? 100 : currentSize.height },
        multiline && styles.inputShellMultiline,
        error && styles.inputShellError
      ]}>
        {left ? <View style={styles.inputLeft}>{left}</View> : null}
        <TextInput
          placeholderTextColor={theme.textSoft}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input, 
            { color: theme.text, fontSize: currentSize.fontSize },
            multiline && styles.inputMultiline, 
            isSmall && { paddingHorizontal: spacing.md },
            style
          ]}
          {...props}
        />
        {right ? <View style={styles.inputRight}>{right}</View> : null}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: theme.danger, fontSize: scaledFont(12, width) }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>{hint}</Text>
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
  const { theme, isDark } = useThemeMode();
  const variantStyles = {
    default: [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }],
    elevated: [styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, styles.cardElevated],
    outlined: [styles.card, { backgroundColor: "transparent", borderColor: theme.borderStrong }, styles.cardOutlined],
    tech: [styles.card, { backgroundColor: isDark ? theme.surface : "rgba(17, 26, 46, 0.95)", borderColor: isDark ? theme.borderStrong : "rgba(79, 124, 255, 0.2)" }, styles.cardTech],
  };

  return (
    <View style={[variantStyles[variant], style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  
  return (
    <View style={styles.sectionTitleBlock}>
      <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>{subtitle}</Text>
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
  const { theme } = useThemeMode();
  const isSmall = width <= 360;
  
  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.chip, 
        { backgroundColor: theme.surface, borderColor: theme.border },
        active && styles.chipActive,
        active && { backgroundColor: theme.primary, borderColor: theme.primary },
        size === "sm" && styles.chipSmall,
        isSmall && styles.chipCompact
      ]}
    >
      <Text style={[
        styles.chipText, 
        active && styles.chipTextActive,
        { color: active ? theme.white : theme.textMuted },
        { fontSize: scaledFont(size === "sm" ? 12 : 13, width) }
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ 
  icon = "-",
  iconName,
  title, 
  description, 
  action 
}: { 
  icon?: string; 
  iconName?: IconSymbolName | string;
  title: string; 
  description: string; 
  action?: React.ReactNode 
}) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  
  return (
    <Card style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        {iconName ? (
          <IconSymbol name={iconName} size={26} color={theme.primary} />
        ) : (
          <Text style={styles.emptyIcon}>{icon}</Text>
        )}
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>{description}</Text>
      {action ? <View style={{ marginTop: spacing.lg, width: "100%" }}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  
  return (
    <View style={styles.loading}>
      <View style={styles.loadingSpinner}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
      <Text style={[styles.loadingText, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>{label}</Text>
    </View>
  );
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  iconName,
  tone = "blue", 
  caption 
}: { 
  title: string; 
  value: number | string; 
  icon?: string; 
  iconName?: IconSymbolName | string;
  tone?: "blue" | "green" | "orange" | "violet" | "danger"; 
  caption?: string 
}) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  const isSmall = width <= 360;
  
  const toneStyle =
    tone === "green" ? styles.statIconGreen 
    : tone === "orange" ? styles.statIconOrange 
    : tone === "violet" ? styles.statIconViolet 
    : tone === "danger" ? styles.statIconDanger
    : styles.statIconBlue;

  return (
    <Card style={[styles.statCard, isSmall && styles.statCardCompact]}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, toneStyle, isSmall && styles.statIconSmall]}>
          {iconName ? (
            <IconSymbol
              name={iconName}
              size={isSmall ? 16 : 18}
              color={
                tone === "green" ? theme.success
                : tone === "orange" ? theme.warning
                : tone === "violet" ? theme.accent
                : tone === "danger" ? theme.danger
                : theme.primary
              }
            />
          ) : (
            <Text style={[styles.statIconText, { fontSize: scaledFont(16, width) }]}>{icon || "-"}</Text>
          )}
        </View>
        <View style={[styles.statBadge, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.statBadgeText, { color: theme.textMuted, fontSize: scaledFont(10, width) }]}>Hoje</Text>
        </View>
      </View>
      <Text style={[styles.statValue, { color: theme.text, fontSize: scaledFont(isSmall ? 22 : 26, width) }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>{title}</Text>
      {caption ? (
        <Text style={[styles.statCaption, { color: theme.textSoft, fontSize: scaledFont(11, width) }]}>{caption}</Text>
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
  const { theme } = useThemeMode();

  return (
    <View style={[styles.dividerRow, style]}>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      {text ? <Text style={[styles.dividerText, { color: theme.textMuted }]}>{text}</Text> : null}
      {text ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
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
  const { theme } = useThemeMode();
  const variantStyles = {
    default: { bg: theme.primarySoft, text: theme.primary },
    success: { bg: theme.successSoft, text: theme.success },
    warning: { bg: theme.warningSoft, text: theme.warning },
    danger: { bg: theme.dangerSoft, text: theme.danger },
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
  statIconDanger: { backgroundColor: colors.dangerSoft },
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
