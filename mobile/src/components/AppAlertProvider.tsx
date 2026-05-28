import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import type { AlertButton, AlertOptions } from "react-native";
import { IconSymbol } from "./IconSymbol";
import { fonts, radius, shadow, spacing, scaledFont } from "../theme";
import { useThemeMode } from "../context/ThemeContext";

type AppAlertItem = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};

type AlertFn = typeof Alert.alert;

const nativeAlert = Alert.alert.bind(Alert);
let alertId = 0;
let activeAlertHandler: AlertFn | null = null;

export const showAppAlert: AlertFn = (title, message, buttons, options) => {
  if (activeAlertHandler) {
    activeAlertHandler(title, message, buttons, options);
    return;
  }

  nativeAlert(title, message, buttons, options);
};

function normalizeButtons(buttons?: AlertButton[]) {
  if (buttons && buttons.length > 0) {
    return buttons;
  }

  return [{ text: "OK", style: "default" as const }];
}

function getAlertTone(title: string) {
  const normalizedTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    normalizedTitle.includes("erro") ||
    normalizedTitle.includes("invalido") ||
    normalizedTitle.includes("indisponivel") ||
    normalizedTitle.includes("nao foi possivel")
  ) {
    return "danger";
  }

  if (
    normalizedTitle.includes("salvo") ||
    normalizedTitle.includes("criado") ||
    normalizedTitle.includes("agendado") ||
    normalizedTitle.includes("concluido") ||
    normalizedTitle.includes("concluida") ||
    normalizedTitle.includes("parabens") ||
    normalizedTitle.includes("atualizada") ||
    normalizedTitle.includes("enviado")
  ) {
    return "success";
  }

  if (
    normalizedTitle.includes("atencao") ||
    normalizedTitle.includes("permissao") ||
    normalizedTitle.includes("privacidade") ||
    normalizedTitle.includes("remover") ||
    normalizedTitle.includes("sair")
  ) {
    return "warning";
  }

  return "info";
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AppAlertItem[]>([]);
  const { theme } = useThemeMode();
  const { width } = useWindowDimensions();

  const currentAlert = alerts[0] ?? null;
  const tone = currentAlert ? getAlertTone(currentAlert.title) : "info";
  const toneColor =
    tone === "danger" ? theme.danger
    : tone === "success" ? theme.success
    : tone === "warning" ? theme.warning
    : theme.primary;
  const toneBackground =
    tone === "danger" ? theme.dangerSoft
    : tone === "success" ? theme.successSoft
    : tone === "warning" ? theme.warningSoft
    : theme.primarySoft;
  const iconName =
    tone === "danger" ? "alert-circle-outline"
    : tone === "success" ? "check-circle-outline"
    : tone === "warning" ? "alert-outline"
    : "information-outline";

  const enqueueAlert = useCallback<AlertFn>((title, message, buttons, options) => {
    const item: AppAlertItem = {
      id: alertId += 1,
      title: String(title || ""),
      message: typeof message === "string" ? message : undefined,
      buttons: normalizeButtons(buttons),
      options
    };

    setAlerts((items) => [...items, item]);
  }, []);

  useEffect(() => {
    const previousAlert = Alert.alert;
    activeAlertHandler = enqueueAlert;
    Alert.alert = showAppAlert;

    return () => {
      activeAlertHandler = null;
      Alert.alert = previousAlert;
    };
  }, [enqueueAlert]);

  const dismissAlert = useCallback(() => {
    setAlerts((items) => items.slice(1));
  }, []);

  const handleBackdropPress = useCallback(() => {
    if (!currentAlert || currentAlert.options?.cancelable === false) {
      return;
    }

    currentAlert.options?.onDismiss?.();
    dismissAlert();
  }, [currentAlert, dismissAlert]);

  const orderedButtons = useMemo(() => {
    if (!currentAlert) {
      return [];
    }

    return currentAlert.buttons;
  }, [currentAlert]);

  function handleButtonPress(button: AlertButton) {
    dismissAlert();
    button.onPress?.();
  }

  return (
    <>
      {children}
      <Modal
        transparent
        visible={Boolean(currentAlert)}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleBackdropPress}
      >
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                width: Math.min(width - spacing.xl * 2, 420)
              }
            ]}
          >
            {currentAlert ? (
              <>
                <View style={[styles.iconShell, { backgroundColor: toneBackground }]}>
                  <IconSymbol name={iconName} size={28} color={toneColor} />
                </View>

                <Text style={[styles.title, { color: theme.text, fontSize: scaledFont(20, width) }]}>
                  {currentAlert.title}
                </Text>

                {currentAlert.message ? (
                  <Text style={[styles.message, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
                    {currentAlert.message}
                  </Text>
                ) : null}

                <View style={styles.actions}>
                  {orderedButtons.map((button, index) => {
                    const isCancel = button.style === "cancel";
                    const isDestructive = button.style === "destructive";
                    const buttonColor = isDestructive ? theme.danger : isCancel ? theme.surfaceMuted : theme.primary;
                    const textColor = isDestructive || !isCancel ? theme.white : theme.text;

                    return (
                      <Pressable
                        key={`${button.text || "OK"}-${index}`}
                        style={({ pressed }) => [
                          styles.actionButton,
                          {
                            backgroundColor: buttonColor,
                            borderColor: isCancel ? theme.border : buttonColor
                          },
                          pressed && styles.actionPressed
                        ]}
                        onPress={() => handleButtonPress(button)}
                      >
                        <Text style={[styles.actionText, { color: textColor, fontSize: scaledFont(14, width) }]}>
                          {button.text || "OK"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 11, 22, 0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  card: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.medium
  },
  iconShell: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  title: {
    fontFamily: fonts.title,
    textAlign: "center",
    lineHeight: 26
  },
  message: {
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 21,
    marginTop: spacing.sm
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  actionButton: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  actionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }]
  },
  actionText: {
    fontFamily: fonts.bold,
    textAlign: "center"
  }
});
