export const colors = {
  background: "#EEF2F7",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  text: "#0F172A",
  textMuted: "#64748B",
  textSoft: "#94A3B8",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "#DBEAFE",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
  cyan: "#0891B2",
  cyanSoft: "#CFFAFE",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  dark: "#0B1220",
  white: "#FFFFFF"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32
};

export const shadows = {
  soft: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  }
};

export const categoryMeta: Record<string, { label: string; icon: string; color: string; soft: string }> = {
  HEALTH: { label: "Saúde", icon: "💊", color: colors.danger, soft: colors.dangerSoft },
  STUDY: { label: "Estudos", icon: "📚", color: colors.primary, soft: colors.primarySoft },
  WORKOUT: { label: "Treino", icon: "🏋️", color: colors.success, soft: colors.successSoft },
  WORK: { label: "Trabalho", icon: "💼", color: colors.purple, soft: colors.purpleSoft },
  SLEEP: { label: "Sono", icon: "🌙", color: colors.cyan, soft: colors.cyanSoft },
  WATER: { label: "Água", icon: "💧", color: colors.cyan, soft: colors.cyanSoft },
  PERSONAL: { label: "Pessoal", icon: "✨", color: colors.warning, soft: colors.warningSoft },
  OTHER: { label: "Outro", icon: "🔔", color: colors.textMuted, soft: colors.surfaceMuted }
};

export function getCategoryMeta(category?: string | null) {
  return categoryMeta[category || "OTHER"] || categoryMeta.OTHER;
}
