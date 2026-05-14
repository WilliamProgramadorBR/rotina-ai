import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, useWindowDimensions } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  
  // Altura minima responsiva - maior em telas pequenas para melhor touch target
  const minHeight = width < 360 ? 48 : 52;
  // Tamanho da fonte responsivo
  const fontSize = width < 360 ? 15 : 16;
  const variantStyle =
    variant === "secondary"
      ? { backgroundColor: theme.surfaceMuted, borderColor: theme.border }
      : variant === "danger"
      ? { backgroundColor: theme.danger }
      : variant === "ghost"
      ? { backgroundColor: "transparent" }
      : { backgroundColor: theme.success };
  const textColor =
    variant === "primary" ? "#052E16"
    : variant === "secondary" ? theme.text
    : variant === "danger" ? theme.white
    : theme.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        { minHeight },
        variantStyle,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#052E16" : theme.text} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%"
  },
  primary: {
    backgroundColor: "#22C55E",
  },
  secondary: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  danger: {
    backgroundColor: "#EF4444",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  primaryText: {
    color: "#052E16",
  },
  secondaryText: {
    color: "#E2E8F0",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  ghostText: {
    color: "#93C5FD",
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
