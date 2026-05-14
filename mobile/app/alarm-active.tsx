import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../src/services/api";
import { useThemeMode } from "../src/context/ThemeContext";
import { scheduleSnoozeAlarm } from "../src/services/alarmNotifications";
import { playAlarmRingtone, stopAlarmRingtone } from "../src/services/customRingtone";
import { colors, spacing } from "../src/theme";

type AlarmAction = "DONE" | "SNOOZED" | "SKIPPED";

function getSafeString(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] || fallback;
  }

  return value || fallback;
}

function formatAlarmTime(value: string) {
  if (!value) return "Agora";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Agora";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function AlarmActiveScreen() {
  const { theme, isDark } = useThemeMode();
  const params = useLocalSearchParams();

  const reminderId = getSafeString(params.reminderId);
  const title = getSafeString(params.title, "Alarme");
  const description = getSafeString(params.description);
  const startAt = getSafeString(params.startAt);
  const scheduleTitle = getSafeString(params.scheduleTitle);
  const notificationAction = getSafeString(params.action);
  const isTestAlarm = reminderId === "test-alarm";

  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeLabel = useMemo(() => formatAlarmTime(startAt), [startAt]);

  useEffect(() => {
    playAlarmRingtone().catch((error) => console.log("[ALARM RINGTONE ERROR]", error));

    return () => {
      stopAlarmRingtone();
    };
  }, []);

  async function registerAction(action: AlarmAction) {
    if (!reminderId) {
      Alert.alert("Erro", "Lembrete não identificado.");
      return;
    }

    try {
      setIsSubmitting(true);
      await stopAlarmRingtone();

      if (isTestAlarm) {
        if (action === "SNOOZED") {
          await scheduleSnoozeAlarm(
            {
              reminderId,
              title,
              description,
              startAt,
              scheduleTitle
            },
            10
          );

          Alert.alert("Teste adiado", "Vou tocar o alarme de teste novamente em 10 minutos.");
        } else {
          Alert.alert("Teste finalizado", "O alarme de teste foi encerrado.");
        }

        router.replace("/settings");
        return;
      }

      await api.post(`/reminders/${reminderId}/log`, {
        action,
        note:
          action === "DONE"
            ? "Marcado como feito pela tela de alarme."
            : action === "SNOOZED"
              ? "Adiado pela tela de alarme."
              : "Pulado pela tela de alarme."
      });

      if (action === "SNOOZED") {
        await scheduleSnoozeAlarm(
          {
            reminderId,
            title,
            description,
            startAt,
            scheduleTitle
          },
          10
        );

        Alert.alert("Soneca ativada", "Vou te lembrar novamente em 10 minutos.");
      }

      router.replace("/home");
    } catch (error: any) {
      console.log("[ALARM ACTION ERROR]", error?.response?.data || error);

      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Não foi possível atualizar o lembrete."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.glow, { backgroundColor: theme.primary, opacity: isDark ? 0.22 : 0.12 }]} />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.kicker, { color: theme.primary }]}>Alarme ativo</Text>

        <Text style={[styles.time, { color: theme.text }]}>{timeLabel}</Text>

        <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
          <Text style={styles.icon}>⏰</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

        {description ? (
          <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
        ) : (
          <Text style={[styles.description, { color: theme.textMuted }]}>
            Você tem um lembrete importante agora.
          </Text>
        )}

        {scheduleTitle ? (
          <View style={[styles.schedulePill, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.schedulePillText, { color: theme.text }]}>{scheduleTitle}</Text>
          </View>
        ) : null}

        {notificationAction && notificationAction !== "expo.modules.notifications.actions.DEFAULT" ? (
          <Text style={[styles.smallInfo, { color: theme.textMuted }]}>
            Ação recebida: {notificationAction}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, { backgroundColor: theme.primary }]}
            disabled={isSubmitting}
            onPress={() => registerAction("DONE")}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Feito</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, { backgroundColor: theme.primarySoft, borderColor: theme.focusRing, borderWidth: 1 }]}
            disabled={isSubmitting}
            onPress={() => registerAction("SNOOZED")}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Soneca 10 min</Text>
          </Pressable>

          <Pressable
            style={[styles.button, { backgroundColor: theme.dangerSoft, borderColor: theme.danger, borderWidth: 1 }]}
            disabled={isSubmitting}
            onPress={() => registerAction("SKIPPED")}
          >
            <Text style={[styles.skipButtonText, { color: theme.danger }]}>Pular</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050B18",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#2563EB",
    opacity: 0.22,
    top: 90
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center"
  },
  kicker: {
    color: colors.primary,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12
  },
  time: {
    color: colors.text,
    fontSize: 58,
    fontWeight: "900",
    marginTop: spacing.md
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg
  },
  icon: {
    fontSize: 48
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center"
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.sm
  },
  schedulePill: {
    backgroundColor: "#F2F4F7",
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg
  },
  schedulePillText: {
    color: colors.text,
    fontWeight: "800"
  },
  smallInfo: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 12
  },
  actions: {
    width: "100%",
    marginTop: spacing.xl,
    gap: spacing.md
  },
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  doneButton: {
    backgroundColor: colors.primary
  },
  snoozeButton: {
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C7D7FE"
  },
  skipButton: {
    backgroundColor: "#FFF1F3",
    borderWidth: 1,
    borderColor: "#FECDD6"
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontWeight: "900",
    fontSize: 16
  },
  skipButtonText: {
    color: "#BE123C",
    fontWeight: "900",
    fontSize: 16
  }
});
