import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    <View style={[styles.container, mode === "mobile" && styles.mobile]}>
      <View style={styles.brand}>
        <View style={styles.logo}><Text style={styles.logoText}>R</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Rotina AI</Text>
          <Text style={styles.brandSubtitle}>Sua rotina inteligente</Text>
        </View>
        {mode === "mobile" ? (
          <Pressable style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
        ) : null}
      </View>

      <View style={styles.userCard}>
        <Text style={styles.avatar}>{user?.name?.slice(0, 1).toUpperCase() || "U"}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || "Usuário"}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email || "rotina@ai.app"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Menu</Text>
        {items.map((item) => {
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Pressable key={item.path} style={[styles.item, active && styles.itemActive]} onPress={() => navigate(item.path)}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Dica inteligente</Text>
        <Text style={styles.tipText}>Transforme uma rotina escrita em alarmes revisáveis usando IA.</Text>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
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
  mobile: { width: 314 },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  logo: { width: 48, height: 48, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.white, fontSize: 22, fontWeight: "900" },
  brandTitle: { color: colors.white, fontSize: 20, fontWeight: "900" },
  brandSubtitle: { color: "#94A3B8", fontSize: 12, fontWeight: "700", marginTop: 2 },
  closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.white, fontSize: 25, lineHeight: 26 },
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
  userName: { color: colors.white, fontSize: 15, fontWeight: "900" },
  userEmail: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  section: { flex: 1 },
  sectionLabel: { color: "#64748B", textTransform: "uppercase", letterSpacing: 1.2, fontSize: 11, fontWeight: "900", marginBottom: spacing.sm, marginLeft: spacing.sm },
  item: { minHeight: 48, borderRadius: radius.lg, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xs },
  itemActive: { backgroundColor: colors.primary },
  itemIcon: { fontSize: 18, width: 22 },
  itemText: { color: "#CBD5E1", fontSize: 15, fontWeight: "800" },
  itemTextActive: { color: colors.white },
  tipCard: { backgroundColor: "rgba(37,99,235,0.18)", borderWidth: 1, borderColor: "rgba(147,197,253,0.16)", borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  tipTitle: { color: colors.white, fontSize: 15, fontWeight: "900", marginBottom: spacing.xs },
  tipText: { color: "#BFDBFE", fontSize: 13, lineHeight: 19 },
  logoutButton: { minHeight: 48, borderRadius: radius.lg, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center" },
  logoutText: { color: "#FCA5A5", fontWeight: "900" }
});
