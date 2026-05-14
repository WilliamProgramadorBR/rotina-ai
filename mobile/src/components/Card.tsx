import React from "react";
import { StyleSheet, View, ViewProps, useWindowDimensions } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

export function Card({ children, style, ...props }: ViewProps) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();
  
  // Padding responsivo baseado na largura
  const padding = width < 360 ? 14 : width < 400 ? 16 : 18;
  
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111827",
    borderColor: "#1F2937",
    borderWidth: 1,
    borderRadius: 18,
    gap: 12,
    // Garantir que o card respeite a largura disponivel
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden"
  },
});
