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
  background: "#F6F8FC",
  backgroundSoft: "#EEF2F8",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  surfaceElevated: "#FFFFFF",
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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999
};

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  title: "Manrope_800ExtraBold"
};

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
    shadowColor: "#7C3AED",
    shadowOpacity: 0.24,
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

  const map: Record<string, { label: string; icon: string; color: string; background: string; border: string }> = {
    HEALTH: { label: "Saúde", icon: "✚", color: colors.danger, background: colors.dangerSoft, border: "#FFE4E6" },
    STUDY: { label: "Estudo", icon: "✦", color: colors.accent, background: colors.accentSoft, border: "#E9D5FF" },
    WORKOUT: { label: "Treino", icon: "↗", color: colors.success, background: colors.successSoft, border: "#BBF7D0" },
    WORK: { label: "Trabalho", icon: "■", color: colors.warning, background: colors.warningSoft, border: "#FED7AA" },
    SLEEP: { label: "Sono", icon: "◑", color: "#4F46E5", background: "#EEF2FF", border: "#C7D2FE" },
    WATER: { label: "Água", icon: "◌", color: "#0284C7", background: "#E0F2FE", border: "#BAE6FD" },
    PERSONAL: { label: "Pessoal", icon: "●", color: "#7C3AED", background: "#F3E8FF", border: "#DDD6FE" },
    OTHER: { label: "Outro", icon: "•", color: colors.textMuted, background: colors.surfaceMuted, border: colors.border }
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
    CRITICAL: { label: "Crítica", color: colors.danger, background: colors.dangerSoft, border: "#FFE4E6" }
  };

  return map[normalized] || map.NORMAL;
}
