import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { colors, darkColors } from "../theme";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  theme: typeof colors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === "dark";

    return {
      mode,
      isDark,
      theme: isDark ? (darkColors as typeof colors) : colors,
      setMode,
      toggleMode: () => setMode((current) => (current === "dark" ? "light" : "dark"))
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    return {
      mode: "light" as ThemeMode,
      isDark: false,
      theme: colors,
      setMode: () => undefined,
      toggleMode: () => undefined
    };
  }

  return context;
}
