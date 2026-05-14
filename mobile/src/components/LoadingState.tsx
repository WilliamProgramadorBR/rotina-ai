import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  const { theme } = useThemeMode();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0F172A",
  },
  text: {
    color: "#CBD5E1",
    fontSize: 16,
  },
});
