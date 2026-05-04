import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import { colors as defaultColors, fonts, radius, shadow, spacing, scaledFont } from "../theme";
import { useTheme } from "../context/ThemeContext";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
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
  const { theme, isDark } = useTheme();
  const isDisabled = Boolean(disabled || loading);
  
  const sizeStyles = {
    sm: { height: 40, paddingHorizontal: spacing.md, fontSize: scaledFont(13, width) },
    md: { height: 48, paddingHorizontal: spacing.lg, fontSize: scaledFont(14, width) },
    lg: { height: 54, paddingHorizontal: spacing.xl, fontSize: scaledFont(15, width) },
  };
  
  const currentSize = sizeStyles[size];

  const buttonStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: theme.primary, ...shadow.soft },
    ai: { backgroundColor: theme.accent, ...shadow.glow },
    secondary: { 
      backgroundColor: theme.surface, 
      borderWidth: 1, 
      borderColor: theme.border 
    },
    ghost: { backgroundColor: "transparent" },
    danger: { backgroundColor: theme.danger }
  };

  const textColors: Record<string, string> = {
    primary: theme.white,
    ai: theme.white,
    secondary: theme.text,
    ghost: theme.primary,
    danger: theme.white
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
        buttonStyles[variant],
        fullWidth && { width: "100%" },
        pressed && !isDisabled && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.6 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.buttonText, { color: textColors[variant], fontSize: currentSize.fontSize }]}>
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
  containerStyle?: ViewStyle;
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
  const { theme } = useTheme();
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
        { 
          minHeight: multiline ? 100 : currentSize.height,
          borderColor: theme.borderStrong,
          backgroundColor: theme.surface
        },
        multiline && styles.inputShellMultiline,
        error && { borderColor: theme.danger }
      ]}>
        {left ? <View style={styles.inputLeft}>{left}</View> : null}
        <TextInput
          placeholderTextColor={theme.textSoft}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[
            styles.input, 
            { fontSize: currentSize.fontSize, color: theme.text },
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
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined" | "tech";
};

export function Card({ children, style, variant = "default" }: CardProps) {
  const { theme, isDark } = useTheme();
  
  const getVariantStyles = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: theme.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      ...shadow.soft
    };

    switch (variant) {
      case "elevated":
        return { ...base, ...shadow.medium };
      case "outlined":
        return { ...base, backgroundColor: "transparent", borderWidth: 1.5 };
      case "tech":
        return { 
          ...base, 
          backgroundColor: isDark ? "rgba(17, 26, 46, 0.95)" : "rgba(241, 245, 249, 0.95)",
          borderColor: isDark ? "rgba(79, 124, 255, 0.2)" : "rgba(37, 99, 235, 0.15)",
          ...shadow.glow
        };
      default:
        return base;
    }
  };

  return (
    <View style={[getVariantStyles(), style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  
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
  const { theme } = useTheme();
  const isSmall = width <= 360;
  
  return (
    <Pressable 
      onPress={onPress} 
      style={[
        styles.chip, 
        { backgroundColor: theme.surface, borderColor: theme.border },
        active && { backgroundColor: theme.primary, borderColor: theme.primary },
        size === "sm" && styles.chipSmall,
        isSmall && styles.chipCompact
      ]}
    >
      <Text style={[
        styles.chipText, 
        { color: theme.textMuted },
        active && { color: theme.white },
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
  const { theme } = useTheme();
  
  return (
    <Card style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.primarySoft }]}>
        <Text style={styles.emptyIcon}>{icon}</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text, fontSize: scaledFont(18, width) }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>{description}</Text>
      {action ? <View style={{ marginTop: spacing.lg, width: "100%" }}>{action}</View> : null}
    </Card>
  );
}

export function LoadingState({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  
  return (
    <View style={styles.loading}>
      <View style={[styles.loadingSpinner, { backgroundColor: theme.primarySoft }]}>
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
  const { theme } = useTheme();
  const isSmall = width <= 360;
  
  const toneColors = {
    blue: theme.primarySoft,
    green: theme.successSoft,
    orange: theme.warningSoft,
    violet: theme.accentSoft
  };

  return (
    <Card style={[styles.statCard, isSmall && styles.statCardCompact]}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: toneColors[tone] }, isSmall && styles.statIconSmall]}>
          <Text style={[styles.statIconText, { fontSize: scaledFont(16, width) }]}>{icon || "•"}</Text>
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
  style?: ViewStyle 
}) {
  const { theme } = useTheme();
  
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
  const { theme, isDark } = useTheme();
  
  const variantStyles = {
    default: { bg: theme.primarySoft, text: theme.primary },
    success: { bg: theme.successSoft, text: theme.success },
    warning: { bg: theme.warningSoft, text: theme.warning },
    danger: { bg: theme.dangerSoft, text: theme.danger },
    tech: { bg: isDark ? "rgba(79,124,255,0.15)" : "rgba(37,99,235,0.1)", text: isDark ? "#60A5FA" : "#2563EB" },
  };
  
  const current = variantStyles[variant];
  
  return (
    <View style={[styles.badge, { backgroundColor: current.bg }]}>
      <Text style={[styles.badgeText, { color: current.text, fontSize: scaledFont(11, width) }]}>{text}</Text>
    </View>
  );
}

// Toggle de tema
export function ThemeToggle({ showLabel = true }: { showLabel?: boolean }) {
  const { width } = useWindowDimensions();
  const { mode, isDark, theme, setMode } = useTheme();
  
  const getModeLabel = () => {
    switch (mode) {
      case "light": return "Claro";
      case "dark": return "Escuro";
      case "system": return "Sistema";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "light": return "☀️";
      case "dark": return "🌙";
      case "system": return "⚙️";
    }
  };

  const cycleMode = () => {
    if (mode === "light") setMode("dark");
    else if (mode === "dark") setMode("system");
    else setMode("light");
  };

  return (
    <Pressable 
      onPress={cycleMode}
      style={[
        styles.themeToggle,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border }
      ]}
    >
      <Text style={styles.themeToggleIcon}>{getModeIcon()}</Text>
      {showLabel && (
        <Text style={[styles.themeToggleText, { color: theme.text, fontSize: scaledFont(14, width) }]}>
          {getModeLabel()}
        </Text>
      )}
    </Pressable>
  );
}

// Selector de tema completo
export function ThemeSelector() {
  const { width } = useWindowDimensions();
  const { mode, theme, setMode } = useTheme();
  
  const options: { value: "light" | "dark" | "system"; label: string; icon: string }[] = [
    { value: "light", label: "Claro", icon: "☀️" },
    { value: "dark", label: "Escuro", icon: "🌙" },
    { value: "system", label: "Sistema", icon: "⚙️" }
  ];

  return (
    <View style={styles.themeSelectorContainer}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => setMode(option.value)}
          style={[
            styles.themeSelectorOption,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
            mode === option.value && { backgroundColor: theme.primarySoft, borderColor: theme.primary }
          ]}
        >
          <Text style={styles.themeSelectorIcon}>{option.icon}</Text>
          <Text style={[
            styles.themeSelectorText, 
            { color: theme.textMuted, fontSize: scaledFont(13, width) },
            mode === option.value && { color: theme.primary }
          ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
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
  buttonText: { fontFamily: fonts.bold },

  // Input styles
  inputBlock: { marginBottom: spacing.lg },
  label: { 
    fontFamily: fonts.bold, 
    marginBottom: spacing.sm 
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden"
  },
  inputShellMultiline: { alignItems: "flex-start" },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
    fontFamily: fonts.regular 
  },
  errorText: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium
  },

  // Section title
  sectionTitleBlock: { marginBottom: spacing.md },
  sectionTitle: { 
    fontFamily: fonts.title 
  },
  sectionSubtitle: { 
    fontFamily: fonts.regular, 
    marginTop: spacing.xs, 
    lineHeight: 20 
  },

  // Chip styles
  chip: {
    height: 38,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
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
  chipText: { 
    fontFamily: fonts.bold 
  },

  // Empty state
  empty: { 
    alignItems: "center", 
    padding: spacing.xl 
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { 
    fontFamily: fonts.title, 
    textAlign: "center" 
  },
  emptyDescription: { 
    fontFamily: fonts.regular, 
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  loadingText: { 
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
  statBadge: { 
    borderRadius: radius.pill, 
    paddingHorizontal: spacing.sm, 
    paddingVertical: 2 
  },
  statBadgeText: { 
    fontFamily: fonts.bold 
  },
  statValue: { 
    fontFamily: fonts.title, 
    marginTop: spacing.xs 
  },
  statTitle: { 
    fontFamily: fonts.medium, 
    marginTop: 2 
  },
  statCaption: { 
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
    height: 1 
  },
  dividerText: { 
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
  },

  // Theme toggle
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1
  },
  themeToggleIcon: {
    fontSize: 18
  },
  themeToggleText: {
    fontFamily: fonts.medium
  },

  // Theme selector
  themeSelectorContainer: {
    flexDirection: "row",
    gap: spacing.sm
  },
  themeSelectorOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5
  },
  themeSelectorIcon: {
    fontSize: 16
  },
  themeSelectorText: {
    fontFamily: fonts.bold
  }
});
