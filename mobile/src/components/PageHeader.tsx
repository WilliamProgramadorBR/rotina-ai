import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export function PageHeader({
  title,
  subtitle,
  onMenu,
  right
}: {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onMenu ? (
          <Pressable style={styles.menuButton} onPress={onMenu}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.xl
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  menuIcon: { fontSize: 20, color: colors.text, fontWeight: "900" },
  title: { color: colors.text, fontSize: 26, fontWeight: "900" },
  subtitle: { color: colors.textMuted, fontSize: 14, fontWeight: "700", marginTop: 3, textTransform: "capitalize" }
});
