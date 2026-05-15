import React, { ReactNode, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
  StatusBar
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { aiColors, colors, fonts, radius, spacing, scaledFont } from "../theme";
import { useResponsive } from "../hooks/useResponsive";
import { AiBadge } from "./AiVisual";
import { IconSymbol, IconSymbolName } from "./IconSymbol";
import { useThemeMode } from "../context/ThemeContext";

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

const menuItems: Array<{ label: string; icon: IconSymbolName; route: string; group?: string }> = [
  { label: "Meu Dia", icon: "weather-sunny", route: "/meu-dia", group: "principal" },
  { label: "Hoje", icon: "calendar-today", route: "/home", group: "principal" },
  { label: "Dashboard", icon: "chart-box-outline", route: "/dashboard", group: "principal" },
  { label: "Revisao Semanal", icon: "chart-timeline-variant", route: "/weekly-review", group: "principal" },
  { label: "Cronogramas", icon: "format-list-checks", route: "/schedules", group: "rotinas" },
  { label: "Colaboracao", icon: "account-group-outline", route: "/collaboration", group: "rotinas" },
  { label: "Criar com IA", icon: "auto-fix", route: "/ai-prompt", group: "rotinas" },
  { label: "Templates", icon: "format-list-bulleted", route: "/templates", group: "rotinas" },
  { label: "Modo Foco", icon: "timer-outline", route: "/foco", group: "ferramentas" },
  { label: "Diagnostico", icon: "bell-ring-outline", route: "/permission-diagnostics", group: "ferramentas" },
  { label: "Configuracoes", icon: "cog-outline", route: "/settings", group: "ferramentas" }
];

function MobileDrawer({
  visible,
  onClose,
  children
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();

  // Largura do drawer: 84% da tela, max 320px
  const drawerWidth = Math.min(width * 0.84, 320);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={drawerStyles.container}>
        {/* Backdrop - fecha ao tocar */}
        <Pressable
          style={drawerStyles.backdrop}
          onPress={onClose}
          accessible
          accessibilityLabel="Fechar menu"
          accessibilityRole="button"
        />

        {/* Drawer */}
        <View style={[drawerStyles.drawer, { width: drawerWidth, backgroundColor: theme.surface }]}>
          <SafeAreaView
            style={drawerStyles.safeArea}
            edges={["top", "bottom", "left"]}
          >
            {children}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function Sidebar({ onClose, isMobile = false }: { onClose?: () => void; isMobile?: boolean }) {
  const pathname = usePathname();
  const auth = useAuth() as any;
  const user = auth.user;
  const { width } = useWindowDimensions();
  const { isSmallPhone } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const sidebarBg = isDark ? "#070B16" : theme.surface;
  const sidebarPanel = isDark ? "#111A2E" : theme.surfaceMuted;
  const sidebarText = isDark ? "#FFFFFF" : theme.text;
  const sidebarMuted = isDark ? "#AAB4C8" : theme.textMuted;

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

  // Tamanhos de fonte adaptativos
  const brandTitleSize = isSmallPhone ? 18 : scaledFont(20, width);
  const brandSubtitleSize = isSmallPhone ? 10 : scaledFont(11, width);
  const menuItemSize = isSmallPhone ? 13 : scaledFont(14, width);
  const labelSize = isSmallPhone ? 9 : scaledFont(10, width);

  return (
    <View style={[sidebarStyles.container, { backgroundColor: sidebarBg }, isMobile && sidebarStyles.containerMobile]}>
      {/* Header com marca e botao fechar */}
      <View style={sidebarStyles.header}>
        <View style={sidebarStyles.brandRow}>
          <View style={sidebarStyles.logo}>
            <IconSymbol name="brain" size={22} color="#fff" />
          </View>
          <View style={sidebarStyles.brandInfo}>
            <Text style={[sidebarStyles.brandTitle, { color: sidebarText, fontSize: brandTitleSize }]}>
              Rotina AI
            </Text>
            <Text style={[sidebarStyles.brandSubtitle, { color: sidebarMuted, fontSize: brandSubtitleSize }]}>
              Copiloto de rotina
            </Text>
          </View>
        </View>

        {isMobile && (
          <Pressable
            style={[sidebarStyles.closeButton, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.surfaceMuted }]}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible
            accessibilityLabel="Fechar menu"
            accessibilityRole="button"
          >
            <IconSymbol name="close" size={22} color={sidebarText} />
          </Pressable>
        )}
      </View>

      <View style={[sidebarStyles.agentCard, { backgroundColor: sidebarPanel, borderColor: isDark ? "rgba(96,165,250,0.22)" : theme.border }]}>
        <View style={sidebarStyles.agentTop}>
          <AiBadge label="AGENTE ATIVO" tone="cyan" />
          <IconSymbol name="pulse" size={18} color={aiColors.cyan} />
        </View>
        <Text style={[sidebarStyles.agentTitle, { color: sidebarText }]}>Rotina OS</Text>
        <Text style={[sidebarStyles.agentText, { color: sidebarMuted }]}>
          Prioriza tarefas, acompanha alarmes e mostra o proximo passo.
        </Text>
      </View>

      {/* Card do usuario */}
      <View style={[sidebarStyles.userCard, { backgroundColor: sidebarPanel, borderColor: isDark ? "#293246" : theme.border }]}>
        <View style={[sidebarStyles.avatar, { backgroundColor: isDark ? "#fff" : theme.primarySoft }]}>
          <Text style={[sidebarStyles.avatarText, { color: isDark ? colors.text : theme.primary }]}>
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={sidebarStyles.userInfo}>
          <Text style={[sidebarStyles.userName, { color: sidebarText }]} numberOfLines={1}>
            {user?.name || "Usuário"}
          </Text>
          <Text style={[sidebarStyles.userEmail, { color: sidebarMuted }]} numberOfLines={1}>
            {user?.email || "email@exemplo.com"}
          </Text>
        </View>
      </View>

      {/* Menu label */}
      <Text style={[sidebarStyles.menuLabel, { color: isDark ? "#7D8AA6" : theme.textSoft, fontSize: labelSize }]}>Menu</Text>

      {/* Menu items */}
      <ScrollView
        style={sidebarStyles.menuScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={sidebarStyles.menuList}
      >
        {menuItems.map((item) => {
          const active = pathname === item.route || pathname.startsWith(`${item.route}/`);
          return (
            <Pressable
              key={item.route}
              onPress={() => {
                onClose?.();
                router.push(item.route as any);
              }}
              style={[
                sidebarStyles.menuItem,
                active && sidebarStyles.menuItemActive,
                active && { backgroundColor: theme.primary }
              ]}
              accessible
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={[sidebarStyles.menuItemIcon, active && sidebarStyles.menuItemIconActive]}>
                <IconSymbol
                  name={item.icon}
                  size={19}
                  color={active ? "#fff" : sidebarMuted}
                />
              </View>
              <Text
                style={[sidebarStyles.menuItemText, { color: sidebarText, fontSize: menuItemSize }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={sidebarStyles.footer}>
        <View style={[sidebarStyles.tipCard, { backgroundColor: isDark ? "#122B5C" : theme.primarySoft, borderColor: isDark ? "#254A88" : theme.focusRing }]}>
          <Text style={[sidebarStyles.tipTitle, { color: isDark ? "#fff" : theme.primary }]}>Dica inteligente</Text>
          <Text style={[sidebarStyles.tipText, { color: isDark ? "#D6E2FF" : theme.primaryDark }]}>
            Transforme uma rotina escrita em alarmes usando IA.
          </Text>
        </View>

        <Pressable
          style={[sidebarStyles.logoutButton, { backgroundColor: isDark ? "#2A1626" : theme.dangerSoft, borderColor: isDark ? "#4B2640" : "#FECDD6" }]}
          onPress={handleLogout}
          accessible
          accessibilityRole="button"
        >
          <Text style={[sidebarStyles.logoutText, { color: isDark ? "#FDA4AF" : theme.danger }]}>Sair da conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ScreenLayout({ children, scroll = true }: ScreenLayoutProps) {
  const { isPhone, isPhoneLarge, isTablet, isDesktop, paddingHorizontal, paddingVertical, isSmallPhone } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const isWide = isDesktop;
  const isMobileOrTablet = !isDesktop;

  // Padding responsivo - maior em telas maiores
  const contentPaddingH = isSmallPhone ? 12 : isPhone ? 16 : paddingHorizontal;
  const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const topSafePadding = Math.max(insets.top, statusBarHeight);
  const bottomSafePadding = Math.max(insets.bottom, spacing.md);

  const content = children({
    openMenu,
    closeMenu,
    isPhone: isPhone || isSmallPhone,
    isPhoneLarge,
    isTablet,
    isDesktop,
    isWide
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={["left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Desktop sidebar */}
      {isDesktop && <Sidebar />}

      {/* Mobile/Tablet drawer */}
      {isMobileOrTablet && (
        <MobileDrawer visible={menuOpen} onClose={closeMenu}>
          <Sidebar onClose={closeMenu} isMobile />
        </MobileDrawer>
      )}

      {/* Main content */}
      <View style={styles.content}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: contentPaddingH,
                paddingTop: topSafePadding + paddingVertical,
                paddingBottom: bottomSafePadding + spacing.xxxl
              }
            ]}
          >
            {content}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.noScrollContent,
              {
                paddingHorizontal: contentPaddingH,
                paddingTop: topSafePadding + paddingVertical,
                paddingBottom: bottomSafePadding
              }
            ]}
          >
            {content}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)"
  },
  drawer: {
    height: "100%",
    backgroundColor: "#0B1220",
    // Sombra para dar profundidade
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10
      },
      android: {
        elevation: 16
      }
    })
  },
  safeArea: {
    flex: 1
  }
});

const sidebarStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: 280,
    backgroundColor: "#0B1220",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md
  },
  containerMobile: {
    width: "100%",
    paddingHorizontal: spacing.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1
  },
  brandInfo: {
    flex: 1,
    minWidth: 0
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm
  },
  closeText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300"
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
  agentCard: {
    borderRadius: radius.lg,
    backgroundColor: "#0F1A2E",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  agentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  agentTitle: {
    color: "#fff",
    fontFamily: fonts.title,
    fontSize: 16
  },
  agentText: {
    color: "#AAB4C8",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs
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
    fontFamily: fonts.title,
    fontSize: 16
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 14
  },
  userEmail: {
    color: "#AAB4C8",
    fontFamily: fonts.regular,
    fontSize: 12
  },
  menuLabel: {
    color: "#7D8AA6",
    fontFamily: fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs
  },
  menuScroll: {
    flex: 1
  },
  menuList: {
    gap: spacing.xs
  },
  menuItem: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  menuItemActive: {
    backgroundColor: "rgba(79, 124, 255, 0.15)"
  },
  menuItemIcon: {
    width: 36,
    height: 36,
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
    fontFamily: fonts.medium,
    flex: 1
  },
  footer: {
    marginTop: spacing.md
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
    fontSize: 13,
    marginBottom: spacing.xs
  },
  tipText: {
    color: "#D6E2FF",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: "#2A1626",
    borderWidth: 1,
    borderColor: "#4B2640",
    alignItems: "center",
    justifyContent: "center"
  },
  logoutText: {
    color: "#FDA4AF",
    fontFamily: fonts.bold,
    fontSize: 14
  }
});

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
  }
});
