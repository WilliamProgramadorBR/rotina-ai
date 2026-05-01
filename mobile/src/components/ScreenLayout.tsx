import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { SideMenu } from "./SideMenu";

export function ScreenLayout({
  children,
  scroll = true
}: {
  children: (props: { openMenu: () => void; isWide: boolean }) => React.ReactNode;
  scroll?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 840;
  const [menuOpen, setMenuOpen] = useState(false);

  const content = children({ openMenu: () => setMenuOpen(true), isWide });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        {isWide ? <SideMenu mode="desktop" /> : null}
        <View style={[styles.main, isWide && styles.mainWide]}>
          {scroll ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}>
              {content}
            </ScrollView>
          ) : (
            <View style={[styles.scroll, styles.fill, isWide && styles.scrollWide]}>{content}</View>
          )}
        </View>
      </View>

      {!isWide ? (
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
            <SideMenu mode="mobile" onClose={() => setMenuOpen(false)} />
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, flexDirection: "row" },
  main: { flex: 1 },
  mainWide: { alignItems: "center" },
  fill: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  scrollWide: { width: "100%", maxWidth: 980, paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxl },
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.46)" }
});
