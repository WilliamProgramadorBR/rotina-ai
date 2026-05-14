export const palette = {
  ink950: "#070B16",
  ink900: "#0B1220",
  ink850: "#111827",
  ink800: "#162033",
  ink700: "#25324A",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate300: "#CBD5E1",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  blue600: "#2563EB",
  blue500: "#3B82F6",
  cyan500: "#06B6D4",
  cyan400: "#22D3EE",
  violet700: "#6D28D9",
  violet600: "#7C3AED",
  violet500: "#8B5CF6",
  fuchsia500: "#D946EF",
  emerald600: "#059669",
  emerald500: "#10B981",
  amber600: "#D97706",
  amber500: "#F59E0B",
  rose600: "#E11D48",
  rose500: "#F43F5E",
  red600: "#DC2626"
};

export const colors = {
  background: "#F4F7FB",
  backgroundSoft: "#EAF0F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  surfaceElevated: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.82)",
  sidebar: "#0B1220",
  sidebarSoft: "#111A2E",
  text: "#111827",
  textMuted: "#64748B",
  textSoft: "#94A3B8",
  primary: palette.blue600,
  primaryDark: "#1D4ED8",
  primarySoft: "#EAF1FF",
  accent: palette.violet600,
  accentSoft: "#F1EAFF",
  success: palette.emerald600,
  successSoft: "#ECFDF5",
  warning: palette.amber600,
  warningSoft: "#FFF7ED",
  danger: palette.rose600,
  dangerSoft: "#FFF1F2",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  focusRing: "#B9D3FF",
  dark: palette.ink900,
  darkSoft: palette.ink800,
  white: "#FFFFFF"
};

export const darkColors = {
  background: "#070B16",
  backgroundSoft: "#0B1220",
  surface: "#111A2E",
  surfaceMuted: "#182238",
  surfaceElevated: "#121B2F",
  surfaceGlass: "rgba(17,26,46,0.82)",
  sidebar: "#070B16",
  sidebarSoft: "#111A2E",
  text: "#F8FAFC",
  textMuted: "#CBD5E1",
  textSoft: "#94A3B8",
  primary: "#4F7CFF",
  primaryDark: "#3B61E8",
  primarySoft: "#162A60",
  accent: "#9D6BFF",
  accentSoft: "#261A45",
  success: "#34D399",
  successSoft: "#0D3328",
  warning: "#FBBF24",
  warningSoft: "#3A2710",
  danger: "#FB7185",
  dangerSoft: "#3A1420",
  border: "#24324A",
  borderStrong: "#334155",
  focusRing: "#3159B8",
  dark: "#070B16",
  darkSoft: "#0B1220",
  white: "#FFFFFF"
};

export const gradients = {
  primary: ["#2563EB", "#7C3AED"],
  ai: ["#1D4ED8", "#7C3AED", "#22D3EE"],
  sidebar: ["#060A14", "#0B1220", "#111A2E"],
  danger: ["#3A1020", "#2A102A"]
};

export const aiColors = {
  cobalt: "#2563EB",
  violet: "#7C3AED",
  cyan: "#06B6D4",
  mint: "#10B981",
  amber: "#F59E0B",
  rose: "#E11D48",
  ink: "#07101F",
  panel: "#0B1220",
  panelSoft: "#111A2E",
  line: "rgba(148, 163, 184, 0.18)",
  lineStrong: "rgba(96, 165, 250, 0.36)"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999
};

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  title: "Manrope_800ExtraBold"
};

export const typography = {
  h1: { fontSize: 28, lineHeight: 34 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 18, lineHeight: 24 },
  h4: { fontSize: 16, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, lineHeight: 16 },
  caption: { fontSize: 11, lineHeight: 14 }
};

export function scaledFont(baseFontSize: number, screenWidth: number): number {
  void screenWidth;
  return baseFontSize;
}

export function scaledSpacing(baseSpacing: number, screenWidth: number): number {
  const baseWidth = 375;
  const scale = Math.min(screenWidth / baseWidth, 1.2);
  return Math.round(baseSpacing * Math.max(scale, 0.9));
}

export const shadow = {
  none: {},
  soft: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  medium: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6
  },
  glow: {
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  }
};

export const shadows = shadow;

export type ScheduleCategory =
  | "HEALTH"
  | "STUDY"
  | "WORKOUT"
  | "WORK"
  | "SLEEP"
  | "WATER"
  | "PERSONAL"
  | "OTHER"
  | string
  | undefined
  | null;

export function getCategoryMeta(category: ScheduleCategory) {
  const normalized = String(category || "OTHER").toUpperCase();

  const map: Record<
    string,
    {
      label: string;
      icon: string;
      iconName: string;
      color: string;
      background: string;
      border: string;
    }
  > = {
    HEALTH: { label: "Saude", icon: "+", iconName: "heart-pulse", color: colors.danger, background: colors.dangerSoft, border: "#FFE4E6" },
    STUDY: { label: "Estudo", icon: "*", iconName: "school-outline", color: colors.accent, background: colors.accentSoft, border: "#E9D5FF" },
    WORKOUT: { label: "Treino", icon: "^", iconName: "run", color: colors.success, background: colors.successSoft, border: "#BBF7D0" },
    WORK: { label: "Trabalho", icon: "#", iconName: "briefcase-outline", color: colors.warning, background: colors.warningSoft, border: "#FED7AA" },
    SLEEP: { label: "Sono", icon: "o", iconName: "weather-night", color: "#4F46E5", background: "#EEF2FF", border: "#C7D2FE" },
    WATER: { label: "Agua", icon: "~", iconName: "water-outline", color: "#0284C7", background: "#E0F2FE", border: "#BAE6FD" },
    PERSONAL: { label: "Pessoal", icon: "P", iconName: "account-outline", color: "#7C3AED", background: "#F3E8FF", border: "#DDD6FE" },
    OTHER: { label: "Outro", icon: "-", iconName: "dots-grid", color: colors.textMuted, background: colors.surfaceMuted, border: colors.border }
  };

  return map[normalized] || map.OTHER;
}

export type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | string | undefined | null;

export function getPriorityMeta(priority: Priority) {
  const normalized = String(priority || "NORMAL").toUpperCase();

  const map: Record<string, { label: string; color: string; background: string; border: string }> = {
    LOW: { label: "Baixa", color: colors.success, background: colors.successSoft, border: "#BBF7D0" },
    NORMAL: { label: "Normal", color: colors.primary, background: colors.primarySoft, border: "#C7D7FE" },
    HIGH: { label: "Alta", color: colors.warning, background: colors.warningSoft, border: "#FED7AA" },
    CRITICAL: { label: "Critica", color: colors.danger, background: colors.dangerSoft, border: "#FFE4E6" }
  };

  return map[normalized] || map.NORMAL;
}
