import React, { ReactNode, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { router, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, radius, spacing, scaledFont } from "../theme";
import { useResponsive } from "../hooks/useResponsive";

type ScreenLayoutProps = {
  scroll?: boolean;
  children: (props: {
    openMenu: () => void;
    closeMenu: () => void;
    isPhone: boolean;
    isPhoneLarge: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWide: boolean;
  }) => ReactNode;
};

const menuItems = [
  { label: "Hoje", icon: "H", route: "/home" },
  { label: "Cronogramas", icon: "C", route: "/schedules" },
  { label: "Criar com IA", icon: "AI", route: "/ai-prompt" },
  { label: "Novo cronograma", icon: "+", route: "/schedules/new" },
  { label: "Configuracoes", icon: "S", route: "/settings" }
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const auth = useAuth() as any;
  const user = auth.user;
  const { width } = useWindowDimensions();

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
          <Text style={[styles.brandTitle, { fontSize: scaledFont(20, width) }]}>Rotina AI</Text>
          <Text style={[styles.brandSubtitle, { fontSize: scaledFont(11, width) }]}>Sua rotina inteligente</Text>
        </View>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { fontSize: scaledFont(16, width) }]}>
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.userName, { fontSize: scaledFont(13, width) }]} numberOfLines={1}>
            {user?.name || "Usuario"}
          </Text>
          <Text style={[styles.userEmail, { fontSize: scaledFont(11, width) }]} numberOfLines={1}>
            {user?.email || "email@exemplo.com"}
          </Text>
        </View>
      </View>

      <Text style={[styles.menuLabel, { fontSize: scaledFont(10, width) }]}>Menu</Text>

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
              <View style={[styles.menuItemIcon, active && styles.menuItemIconActive]}>
                <Text style={[styles.menuItemIconText, active && styles.menuItemIconTextActive]}>
                  {item.icon}
                </Text>
              </View>
              <Text style={[styles.menuItemText, { fontSize: scaledFont(13, width) }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.tipCard}>
        <Text style={[styles.tipTitle, { fontSize: scaledFont(13, width) }]}>Dica inteligente</Text>
        <Text style={[styles.tipText, { fontSize: scaledFont(11, width) }]}>
          Transforme uma rotina escrita em alarmes usando IA.
        </Text>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={[styles.logoutText, { fontSize: scaledFont(13, width) }]}>Sair da conta</Text>
      </Pressable>
    </View>
  );
}

export function ScreenLayout({ children, scroll = true }: ScreenLayoutProps) {
  const { isPhone, isPhoneLarge, isTablet, isDesktop, paddingHorizontal, paddingVertical } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const isWide = isDesktop;

  const content = children({
    openMenu,
    closeMenu,
    isPhone,
    isPhoneLarge,
    isTablet,
    isDesktop,
    isWide
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
              {
                paddingHorizontal,
                paddingTop: paddingVertical,
                paddingBottom: spacing.xxxl
              }
            ]}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.noScrollContent, { padding: paddingHorizontal }]}>
            {content}
          </View>
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
    alignSelf: "center"
  },

  noScrollContent: {
    flex: 1,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center"
  },

  sidebar: {
    width: 260,
    backgroundColor: "#0B1220",
    paddingHorizontal: spacing.md,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },

  logoText: {
    color: "#fff",
    fontFamily: fonts.title,
    fontSize: 18
  },

  brandTitle: {
    color: "#fff",
    fontFamily: fonts.title
  },

  brandSubtitle: {
    color: "#AAB4C8",
    fontFamily: fonts.medium
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "#182033",
    borderWidth: 1,
    borderColor: "#293246",
    marginBottom: spacing.xl
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },

  avatarText: {
    color: colors.text,
    fontFamily: fonts.title
  },

  userName: {
    color: "#fff",
    fontFamily: fonts.bold
  },

  userEmail: {
    color: "#AAB4C8",
    fontFamily: fonts.regular
  },

  menuLabel: {
    color: "#7D8AA6",
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm
  },

  menuList: {
    gap: spacing.xs
  },

  menuItem: {
    height: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },

  menuItemActive: {
    backgroundColor: "rgba(79, 124, 255, 0.15)"
  },

  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center"
  },

  menuItemIconActive: {
    backgroundColor: colors.primary
  },

  menuItemIconText: {
    color: "#AAB4C8",
    fontFamily: fonts.bold,
    fontSize: 12
  },

  menuItemIconTextActive: {
    color: "#fff"
  },

  menuItemText: {
    color: "#fff",
    fontFamily: fonts.medium
  },

  tipCard: {
    backgroundColor: "#122B5C",
    borderWidth: 1,
    borderColor: "#254A88",
    borderRadius: radius.lg,
    padding: spacing.md,
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
    lineHeight: 17
  },

  logoutButton: {
    height: 44,
    borderRadius: radius.md,
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
    backgroundColor: "rgba(0,0,0,0.55)"
  },

  drawer: {
    width: 280,
    maxWidth: "85%",
    height: "100%"
  }
});
