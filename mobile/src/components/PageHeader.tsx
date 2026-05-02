import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { colors, fonts, radius, spacing, scaledFont } from "../theme";
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
  const { width, isPhone, isSmallPhone } = useResponsive();
  const isMobile = isPhone || isSmallPhone;

  return (
    <View style={styles.container}>
      <View style={[styles.topRow, isMobile && styles.topRowMobile]}>
        <View style={styles.leftSide}>
          {onMenu ? (
            <Pressable style={[styles.menuButton, isSmallPhone && styles.menuButtonSmall]} onPress={onMenu}>
              <Text style={[styles.menuText, { fontSize: scaledFont(16, width) }]}>=</Text>
            </Pressable>
          ) : null}

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[
                styles.title, 
                { fontSize: scaledFont(isMobile ? 24 : 30, width) }
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>

            {subtitle ? (
              <Text 
                style={[styles.subtitle, { fontSize: scaledFont(13, width) }]} 
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {right ? (
          <View style={isMobile ? styles.rightMobile : styles.right}>
            {right}
          </View>
        ) : null}
      </View>

      {searchPlaceholder ? (
        <View style={[styles.bottomRow, isMobile && styles.bottomRowMobile]}>
          <View style={[styles.searchBox, isSmallPhone && styles.searchBoxSmall]}>
            <View style={styles.searchIconBox}>
              <Text style={[styles.searchIcon, { fontSize: scaledFont(12, width) }]}>S</Text>
            </View>
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSoft}
              style={[styles.searchInput, { fontSize: scaledFont(14, width) }]}
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

  topRowMobile: {
    gap: spacing.sm
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

  rightMobile: {
    alignSelf: "flex-start"
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },

  menuButtonSmall: {
    width: 38,
    height: 38,
    borderRadius: radius.md
  },

  menuText: {
    color: colors.text,
    fontFamily: fonts.bold
  },

  title: {
    color: colors.text,
    fontFamily: fonts.title,
    lineHeight: 36
  },

  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: fonts.medium,
    lineHeight: 19
  },

  bottomRow: {
    marginTop: spacing.md
  },

  bottomRowMobile: {
    marginTop: spacing.sm
  },

  searchBox: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },

  searchBoxSmall: {
    height: 44
  },

  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },

  searchIcon: {
    color: colors.primary,
    fontFamily: fonts.bold
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular
  }
});
