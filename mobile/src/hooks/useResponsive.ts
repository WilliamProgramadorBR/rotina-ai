import { useWindowDimensions, Platform } from "react-native";
import { spacing, scaledFont, scaledSpacing } from "../theme";

export type DeviceSize = "phone" | "phoneLarge" | "tablet" | "desktop";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // Device breakpoints otimizados para mobile-first
  const isSmallPhone = width <= 360;
  const isPhone = width <= 480;
  const isPhoneLarge = width > 480 && width <= 680;
  const isTablet = width > 680 && width <= 1024;
  const isDesktop = width > 1024;

  // Device size como string
  const deviceSize: DeviceSize = isPhone || isSmallPhone
    ? "phone"
    : isPhoneLarge
    ? "phoneLarge"
    : isTablet
    ? "tablet"
    : "desktop";

  // Sistema de grid responsivo
  const columns = isPhone ? 1 : isPhoneLarge ? 2 : isTablet ? 2 : 4;

  // Espaçamentos responsivos
  const paddingHorizontal = isSmallPhone
    ? spacing.md
    : isPhone
    ? spacing.lg
    : isPhoneLarge
    ? spacing.xl
    : spacing.xxl;

  const paddingVertical = isSmallPhone
    ? spacing.md
    : isPhone
    ? spacing.lg
    : spacing.xl;

  // Gap entre elementos
  const gap = isSmallPhone ? spacing.sm : isPhone ? spacing.md : spacing.lg;

  // Tamanhos de fonte responsivos
  const fontScale = (base: number) => scaledFont(base, width);
  
  // Espaçamento responsivo
  const space = (base: number) => scaledSpacing(base, width);

  // Tamanho de cards responsivo
  const cardMinWidth = isSmallPhone ? width - spacing.md * 2 : isPhone ? 150 : 180;
  
  // Container max-width
  const maxContentWidth = isDesktop ? 1280 : isTablet ? 900 : "100%";

  // Detecção de plataforma
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";
  const isMobile = !isWeb;

  // Valores úteis para layouts
  const safeAreaPadding = {
    top: isIOS ? 44 : 24,
    bottom: isIOS ? 34 : 16,
  };

  return {
    // Dimensões
    width,
    height,
    
    // Breakpoints boolean
    isSmallPhone,
    isPhone,
    isPhoneLarge,
    isTablet,
    isDesktop,
    
    // Device info
    deviceSize,
    isMobile,
    isWeb,
    isIOS,
    isAndroid,
    
    // Layout
    columns,
    paddingHorizontal,
    paddingVertical,
    gap,
    maxContentWidth,
    cardMinWidth,
    safeAreaPadding,
    
    // Functions
    fontScale,
    space,
  };
}
