import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme";
import { useResponsive } from "../hooks/useResponsive";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
  right?: React.ReactNode;
  searchPlaceholder?: string;
};

export function PageHeader({
  title,
  subtitle,
  onMenu,
  right,
  searchPlaceholder
}: PageHeaderProps) {
  const { isPhone } = useResponsive();

  return (
    <View style={styles.container}>
      <View style={[styles.topRow, isPhone && styles.topRowPhone]}>
        <View style={styles.leftSide}>
          {onMenu ? (
            <Pressable style={styles.menuButton} onPress={onMenu}>
              <Text style={styles.menuText}>☰</Text>
            </Pressable>
          ) : null}

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.title, isPhone && styles.titlePhone]}
              numberOfLines={2}
            >
              {title}
            </Text>

            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {right ? <View style={isPhone ? styles.rightPhone : styles.right}>{right}</View> : null}
      </View>

      {searchPlaceholder ? (
        <View style={[styles.bottomRow, isPhone && styles.bottomRowPhone]}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSoft}
              style={styles.searchInput}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md
  },

  topRowPhone: {
    flexDirection: "column",
    alignItems: "stretch"
  },

  leftSide: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start"
  },

  right: {
    alignSelf: "flex-start"
  },

  rightPhone: {
    width: "100%"
  },

  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },

  menuText: {
    fontSize: 18,
    color: colors.text
  },

  title: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 34,
    lineHeight: 40
  },

  titlePhone: {
    fontSize: 28,
    lineHeight: 33
  },

  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20
  },

  bottomRow: {
    marginTop: spacing.md
  },

  bottomRowPhone: {
    marginTop: spacing.md
  },

  searchBox: {
    height: 52,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },

  searchIcon: {
    color: colors.textMuted,
    fontSize: 16
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15
  }
});