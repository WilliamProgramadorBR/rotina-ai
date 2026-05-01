import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>{message}</Text>
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
