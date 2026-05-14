import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

type InputProps = TextInputProps & {
  label: string;
};

export function Input({ label, style, ...props }: InputProps) {
  const { theme } = useThemeMode();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textSoft}
        style={[
          styles.input,
          { backgroundColor: theme.surface, borderColor: theme.borderStrong, color: theme.text },
          style
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: "#CBD5E1",
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
