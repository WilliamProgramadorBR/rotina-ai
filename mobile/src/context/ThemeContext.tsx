import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { colors, darkColors } from "../theme";

export type ThemeMode = "light" | "dark";

const THEME_MODE_KEY = "rotina-ai-theme-mode";

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

  useEffect(() => {
    let mounted = true;

    async function loadThemeMode() {
      try {
        const savedMode =
          Platform.OS === "web"
            ? window.localStorage.getItem(THEME_MODE_KEY)
            : await SecureStore.getItemAsync(THEME_MODE_KEY);

        if (!mounted) return;
        if (savedMode === "light" || savedMode === "dark") {
          setMode(savedMode);
        }
      } catch (error) {
        console.log("[THEME] Erro ao carregar tema:", error);
      }
    }

    loadThemeMode();

    return () => {
      mounted = false;
    };
  }, []);

  async function persistMode(nextMode: ThemeMode) {
    setMode(nextMode);

    try {
      if (Platform.OS === "web") {
        window.localStorage.setItem(THEME_MODE_KEY, nextMode);
        return;
      }

      await SecureStore.setItemAsync(THEME_MODE_KEY, nextMode);
    } catch (error) {
      console.log("[THEME] Erro ao salvar tema:", error);
    }
  }

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === "dark";

    return {
      mode,
      isDark,
      theme: isDark ? (darkColors as typeof colors) : colors,
      setMode: persistMode,
      toggleMode: () => persistMode(mode === "dark" ? "light" : "dark")
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
