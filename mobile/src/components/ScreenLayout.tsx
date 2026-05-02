import React, { ReactNode, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { router, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, radius, spacing } from "../theme";
import { useResponsive } from "../hooks/useResponsive";

type ScreenLayoutProps = {
  scroll?: boolean;
  children: (props: {
    openMenu: () => void;
    closeMenu: () => void;
    isPhone: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }) => ReactNode;
};

const menuItems = [
  { label: "Hoje", icon: "🏠", route: "/home" },
  { label: "Cronogramas", icon: "📋", route: "/schedules" },
  { label: "Criar com IA", icon: "✨", route: "/ai-prompt" },
  { label: "Novo cronograma", icon: "➕", route: "/schedules/new" },
  { label: "Teste notificação", icon: "🔔", route: "/settings" }
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const auth = useAuth() as any;
  const user = auth.user;

  async function handleLogout() {
    try {
      if (auth.signOut) {
        await auth.signOut();
      }
      onClose?.();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  }

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>Rotina AI</Text>
          <Text style={styles.brandSubtitle}>Sua rotina inteligente</Text>
        </View>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || "Usuário"}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || "email@exemplo.com"}
          </Text>
        </View>
      </View>

      <Text style={styles.menuLabel}>Menu</Text>

      <View style={styles.menuList}>
        {menuItems.map((item) => {
          const active = pathname === item.route;

          return (
            <Pressable
              key={item.route}
              onPress={() => {
                onClose?.();
                router.push(item.route as any);
              }}
              style={[styles.menuItem, active && styles.menuItemActive]}
            >
              <Text style={styles.menuItemIcon}>{item.icon}</Text>
              <Text style={styles.menuItemText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Dica inteligente</Text>
        <Text style={styles.tipText}>
          Transforme uma rotina escrita em alarmes revisáveis usando IA.
        </Text>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>
    </View>
  );
}

export function ScreenLayout({ children, scroll = true }: ScreenLayoutProps) {
  const { isPhone, isTablet, isDesktop } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const content = children({
    openMenu,
    closeMenu,
    isPhone,
    isTablet,
    isDesktop
  });

  return (
    <SafeAreaView style={styles.root}>
      {isDesktop ? <Sidebar /> : null}

      {!isDesktop ? (
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.backdrop} onPress={closeMenu} />
            <View style={styles.drawer}>
              <Sidebar onClose={closeMenu} />
            </View>
          </View>
        </Modal>
      ) : null}

      <View style={styles.content}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              isPhone && styles.scrollContentPhone,
              isTablet && styles.scrollContentTablet
            ]}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    flexDirection: "row"
  },

  content: {
    flex: 1,
    minWidth: 0
  },

  scrollContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl
  },

  scrollContentTablet: {
    maxWidth: "100%",
    paddingHorizontal: spacing.lg
  },

  scrollContentPhone: {
    maxWidth: "100%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },

  sidebar: {
    width: 280,
    backgroundColor: "#0B1220",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },

  logoText: {
    color: "#fff",
    fontFamily: fonts.title,
    fontSize: 20
  },

  brandTitle: {
    color: "#fff",
    fontFamily: fonts.title,
    fontSize: 22
  },

  brandSubtitle: {
    color: "#AAB4C8",
    fontFamily: fonts.medium,
    fontSize: 12
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: "#182033",
    borderWidth: 1,
    borderColor: "#293246",
    marginBottom: spacing.xl
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },

  avatarText: {
    color: colors.text,
    fontFamily: fonts.title,
    fontSize: 18
  },

  userName: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  userEmail: {
    color: "#AAB4C8",
    fontFamily: fonts.regular,
    fontSize: 11
  },

  menuLabel: {
    color: "#7D8AA6",
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm
  },

  menuList: {
    gap: spacing.xs
  },

  menuItem: {
    height: 48,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },

  menuItemActive: {
    backgroundColor: colors.primary
  },

  menuItemIcon: {
    fontSize: 18,
    color: "#fff"
  },

  menuItemText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  tipCard: {
    backgroundColor: "#122B5C",
    borderWidth: 1,
    borderColor: "#254A88",
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md
  },

  tipTitle: {
    color: "#fff",
    fontFamily: fonts.bold,
    marginBottom: spacing.xs
  },

  tipText: {
    color: "#D6E2FF",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18
  },

  logoutButton: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: "#2A1626",
    borderWidth: 1,
    borderColor: "#4B2640",
    alignItems: "center",
    justifyContent: "center"
  },

  logoutText: {
    color: "#FDA4AF",
    fontFamily: fonts.bold
  },

  modalContainer: {
    flex: 1,
    flexDirection: "row"
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)"
  },

  drawer: {
    width: 280,
    maxWidth: "84%",
    height: "100%"
  }
});