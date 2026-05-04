import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, darkColors } from "../theme";

const THEME_STORAGE_KEY = "@rotina_ai:theme_mode";

export type ThemeMode = "light" | "dark" | "system";

export type ThemeColors = typeof colors;

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  theme: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar preferencia salva
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "system")) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.log("[THEME] Erro ao carregar tema:", error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadTheme();
  }, []);

  // Salvar quando mudar
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.log("[THEME] Erro ao salvar tema:", error);
    }
  };

  const value = useMemo<ThemeContextValue>(() => {
    // Determina se e escuro baseado no modo
    let isDark = false;
    if (mode === "system") {
      isDark = systemColorScheme === "dark";
    } else {
      isDark = mode === "dark";
    }

    return {
      mode,
      isDark,
      theme: isDark ? (darkColors as ThemeColors) : colors,
      setMode,
      toggleMode: () => {
        // Cicla entre light -> dark -> system
        if (mode === "light") setMode("dark");
        else if (mode === "dark") setMode("system");
        else setMode("light");
      }
    };
  }, [mode, systemColorScheme]);

  // Aguarda carregar a preferencia antes de renderizar
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    // Fallback se usado fora do provider
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

// Alias para compatibilidade
export const useThemeMode = useTheme;
