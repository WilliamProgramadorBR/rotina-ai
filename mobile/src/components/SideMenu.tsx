import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, usePathname } from "expo-router";
import { colors, radius, spacing } from "../theme";
import { useAuth } from "../context/AuthContext";

const items = [
  { label: "Hoje", icon: "🏠", path: "/home" },
  { label: "Cronogramas", icon: "📋", path: "/schedules" },
  { label: "Criar com IA", icon: "✨", path: "/ai-prompt" },
  { label: "Novo cronograma", icon: "➕", path: "/schedules/new" },
  { label: "Teste notificação", icon: "🔔", path: "/notifications-test" }
];

export function SideMenu({ mode = "desktop", onClose }: { mode?: "desktop" | "mobile"; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  
  // Largura dinamica para mobile: 84% da tela, max 320px
  const mobileWidth = Math.min(width * 0.84, 320);
  const isSmallScreen = width < 360;

  function navigate(path: string) {
    onClose?.();
    router.push(path as any);
  }

  async function logout() {
    await signOut();
    onClose?.();
    router.replace("/login");
  }

  return (
    <View style={[
      styles.container, 
      mode === "mobile" && { width: mobileWidth }
    ]}>
      {/* Header com marca */}
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <View style={styles.brandInfo}>
          <Text style={[styles.brandTitle, isSmallScreen && styles.brandTitleSmall]}>
            Rotina AI
          </Text>
          <Text style={[styles.brandSubtitle, isSmallScreen && styles.brandSubtitleSmall]}>
            Sua rotina inteligente
          </Text>
        </View>
        {mode === "mobile" && (
          <Pressable 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible
            accessibilityLabel="Fechar menu"
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        )}
      </View>

      {/* Card do usuario */}
      <View style={styles.userCard}>
        <Text style={styles.avatar}>
          {user?.name?.slice(0, 1).toUpperCase() || "U"}
        </Text>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isSmallScreen && styles.userNameSmall]} numberOfLines={1}>
            {user?.name || "Usuário"}
          </Text>
          <Text style={[styles.userEmail, isSmallScreen && styles.userEmailSmall]} numberOfLines={1}>
            {user?.email || "rotina@ai.app"}
          </Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isSmallScreen && styles.sectionLabelSmall]}>
          Menu
        </Text>
        <ScrollView 
          style={styles.menuScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuList}
        >
          {items.map((item) => {
            const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Pressable 
                key={item.path} 
                style={[styles.item, active && styles.itemActive]} 
                onPress={() => navigate(item.path)}
                accessible
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text 
                  style={[
                    styles.itemText, 
                    active && styles.itemTextActive,
                    isSmallScreen && styles.itemTextSmall
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Dica */}
      <View style={styles.tipCard}>
        <Text style={[styles.tipTitle, isSmallScreen && styles.tipTitleSmall]}>
          Dica inteligente
        </Text>
        <Text style={[styles.tipText, isSmallScreen && styles.tipTextSmall]}>
          Transforme uma rotina escrita em alarmes revisáveis usando IA.
        </Text>
      </View>

      {/* Logout */}
      <Pressable 
        style={styles.logoutButton} 
        onPress={logout}
        accessible
        accessibilityRole="button"
      >
        <Text style={[styles.logoutText, isSmallScreen && styles.logoutTextSmall]}>
          Sair da conta
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 296,
    minHeight: "100%",
    backgroundColor: colors.dark,
    padding: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)"
  },
  
  // Brand header
  brand: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: spacing.md, 
    marginBottom: spacing.xl 
  },
  logo: { 
    width: 48, 
    height: 48, 
    borderRadius: 18, 
    backgroundColor: colors.primary, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  logoText: { 
    color: colors.white, 
    fontSize: 22, 
    fontWeight: "900" 
  },
  brandInfo: {
    flex: 1,
    minWidth: 0
  },
  brandTitle: { 
    color: colors.white, 
    fontSize: 20, 
    fontWeight: "900" 
  },
  brandTitleSmall: {
    fontSize: 18
  },
  brandSubtitle: { 
    color: "#94A3B8", 
    fontSize: 12, 
    fontWeight: "700", 
    marginTop: 2 
  },
  brandSubtitleSmall: {
    fontSize: 11
  },
  closeButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: "rgba(255,255,255,0.1)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  closeText: { 
    color: colors.white, 
    fontSize: 28, 
    lineHeight: 30,
    fontWeight: "300"
  },
  
  // User card
  userCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xl
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.white,
    color: colors.dark,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 44,
    fontSize: 18,
    fontWeight: "900"
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: { 
    color: colors.white, 
    fontSize: 15, 
    fontWeight: "900" 
  },
  userNameSmall: {
    fontSize: 14
  },
  userEmail: { 
    color: "#94A3B8", 
    fontSize: 12, 
    marginTop: 2 
  },
  userEmailSmall: {
    fontSize: 11
  },
  
  // Menu section
  section: { 
    flex: 1 
  },
  sectionLabel: { 
    color: "#64748B", 
    textTransform: "uppercase", 
    letterSpacing: 1.2, 
    fontSize: 11, 
    fontWeight: "900", 
    marginBottom: spacing.sm, 
    marginLeft: spacing.sm 
  },
  sectionLabelSmall: {
    fontSize: 10
  },
  menuScroll: {
    flex: 1
  },
  menuList: {
    gap: spacing.xs
  },
  item: { 
    minHeight: 48, 
    borderRadius: radius.lg, 
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row", 
    alignItems: "center", 
    gap: spacing.md
  },
  itemActive: { 
    backgroundColor: colors.primary 
  },
  itemIcon: { 
    fontSize: 18, 
    width: 24,
    textAlign: "center"
  },
  itemText: { 
    color: "#CBD5E1", 
    fontSize: 15, 
    fontWeight: "800",
    flex: 1
  },
  itemTextActive: { 
    color: colors.white 
  },
  itemTextSmall: {
    fontSize: 14
  },
  
  // Tip card
  tipCard: { 
    backgroundColor: "rgba(37,99,235,0.18)", 
    borderWidth: 1, 
    borderColor: "rgba(147,197,253,0.16)", 
    borderRadius: radius.xl, 
    padding: spacing.lg, 
    marginBottom: spacing.lg 
  },
  tipTitle: { 
    color: colors.white, 
    fontSize: 15, 
    fontWeight: "900", 
    marginBottom: spacing.xs 
  },
  tipTitleSmall: {
    fontSize: 14
  },
  tipText: { 
    color: "#BFDBFE", 
    fontSize: 13, 
    lineHeight: 19 
  },
  tipTextSmall: {
    fontSize: 12,
    lineHeight: 17
  },
  
  // Logout
  logoutButton: { 
    minHeight: 48, 
    borderRadius: radius.lg, 
    backgroundColor: "rgba(239,68,68,0.12)", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  logoutText: { 
    color: "#FCA5A5", 
    fontWeight: "900",
    fontSize: 14
  },
  logoutTextSmall: {
    fontSize: 13
  }
});
