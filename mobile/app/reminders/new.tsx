import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../src/services/api";
import { colors, fonts, radius, spacing } from "../../src/theme";
import { toLocalInputDateTime } from "../../src/utils/date";
import { Button, Card, Input } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";
import { useThemeMode } from "../../src/context/ThemeContext";
import { useResponsive } from "../../src/hooks/useResponsive";
import { IconSymbol } from "../../src/components/IconSymbol";
import { scheduleReminderAlarm } from "../../src/services/alarmNotifications";
import type { AlarmLevel } from "../../src/types/api";

const ALARM_LEVELS: Array<{ id: AlarmLevel; label: string; desc: string; icon: string; color: string; bg: string }> = [
  { id: "LEVE", label: "Leve", desc: "Notificação simples", icon: "bell-outline", color: colors.success, bg: colors.successSoft },
  { id: "IMPORTANTE", label: "Importante", desc: "Som + vibração", icon: "bell-ring-outline", color: colors.primary, bg: colors.primarySoft },
  { id: "CRITICO", label: "Crítico", desc: "Persistente + confirmação", icon: "bell-alert-outline", color: colors.danger, bg: colors.dangerSoft },
  { id: "ROTINA", label: "Rotina", desc: "Lembrete suave recorrente", icon: "water-outline", color: "#0284C7", bg: "#E0F2FE" }
];

export default function NewReminderScreen() {
  const { theme } = useThemeMode();
  const { width } = useResponsive();
  const params = useLocalSearchParams<{ scheduleId?: string }>();
  const [scheduleId, setScheduleId] = useState(params.scheduleId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState(toLocalInputDateTime(new Date(Date.now() + 10 * 60 * 1000)));
  const [alarmLevel, setAlarmLevel] = useState<AlarmLevel>("IMPORTANTE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.scheduleId) setScheduleId(params.scheduleId);
  }, [params.scheduleId]);

  async function handleCreate() {
    try {
      if (!scheduleId || !title || !dateTime) {
        Alert.alert("Atenção", "Informe cronograma, título e data/hora.");
        return;
      }

      setIsSubmitting(true);

      const response = await api.post("/reminders", {
        scheduleId,
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: new Date(dateTime).toISOString(),
        timezone: "America/Sao_Paulo",
        alarmLevel
      });

      const createdReminder = response.data.reminder;

      await scheduleReminderAlarm({
        reminderId: createdReminder.id,
        title: createdReminder.title,
        description: createdReminder.description,
        startAt: createdReminder.startAt,
        scheduleTitle: "Lembrete manual",
        alarmLevel
      });

      Alert.alert(
        "Lembrete criado",
        `Salvo com alarme ${ALARM_LEVELS.find((l) => l.id === alarmLevel)?.label || ""}.`
      );

      router.back();
    } catch (error: any) {
      console.log("[CREATE REMINDER ERROR]", error?.response?.data || error);
      Alert.alert("Erro", error?.response?.data?.message || "Não foi possível criar o lembrete.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader
            title="Novo lembrete"
            subtitle="Configure data, hora e contexto"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
              </Pressable>
            }
          />

          <Card>
            <Input label="ID do cronograma" placeholder="ID do cronograma" value={scheduleId} onChangeText={setScheduleId} editable={!params.scheduleId} />
            <Input label="Título" placeholder="Ex: Tomar remédio" value={title} onChangeText={setTitle} />
            <Input label="Descrição" placeholder="Ex: Tomar após alimentação" value={description} onChangeText={setDescription} multiline />
            <Input label="Data e hora" placeholder="YYYY-MM-DDTHH:mm" value={dateTime} onChangeText={setDateTime} />

            {/* Seletor de nível de alarme */}
            <View style={styles.levelSection}>
              <Text style={[styles.levelLabel, { color: theme.text }]}>Nível do alarme</Text>
              <View style={styles.levelGrid}>
                {ALARM_LEVELS.map((level) => {
                  const active = alarmLevel === level.id;
                  return (
                    <Pressable
                      key={level.id}
                      style={[
                        styles.levelCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        active && { backgroundColor: level.bg, borderColor: level.color }
                      ]}
                      onPress={() => setAlarmLevel(level.id)}
                    >
                      <View style={[styles.levelIconBox, { backgroundColor: active ? `${level.color}20` : theme.surfaceMuted }]}>
                        <IconSymbol name={level.icon as any} size={16} color={active ? level.color : theme.textMuted} />
                      </View>
                      <View style={styles.levelTextBox}>
                        <Text style={[styles.levelCardTitle, { color: active ? level.color : theme.text }]}>
                          {level.label}
                        </Text>
                        <Text style={[styles.levelCardDesc, { color: active ? level.color : theme.textMuted }]}>
                          {level.desc}
                        </Text>
                      </View>
                      {active && (
                        <IconSymbol name="check-circle" size={16} color={level.color} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Button title="Criar lembrete" onPress={handleCreate} loading={isSubmitting} style={{ marginTop: spacing.lg }} />
          </Card>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  backText: { fontWeight: "900" },

  levelSection: {
    marginTop: spacing.md
  },
  levelLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: spacing.sm
  },
  levelGrid: {
    gap: spacing.sm
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md
  },
  levelIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  levelTextBox: { flex: 1 },
  levelCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  levelCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 1
  }
});
