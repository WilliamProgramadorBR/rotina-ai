import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../src/services/api";
import { colors, spacing } from "../../src/theme";
import { toLocalInputDateTime } from "../../src/utils/date";
import { Button, Card, Input } from "../../src/components/ui";
import { PageHeader } from "../../src/components/PageHeader";
import { ScreenLayout } from "../../src/components/ScreenLayout";

import { scheduleReminderAlarm } from "../../src/services/alarmNotifications";
export default function NewReminderScreen() {
  const params = useLocalSearchParams<{ scheduleId?: string }>();
  const [scheduleId, setScheduleId] = useState(params.scheduleId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState(toLocalInputDateTime(new Date(Date.now() + 10 * 60 * 1000)));
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
      timezone: "America/Sao_Paulo"
    });

    const createdReminder = response.data.reminder;

await scheduleReminderAlarm({
  reminderId: createdReminder.id,
  title: createdReminder.title,
  description: createdReminder.description,
  startAt: createdReminder.startAt,
  scheduleTitle: "Lembrete manual"
});

    Alert.alert(
      "Lembrete criado",
      "O lembrete foi salvo e o modo alarme foi agendado."
    );

    router.back();
  } catch (error: any) {
    console.log("[CREATE REMINDER ERROR]", error?.response?.data || error);

    Alert.alert(
      "Erro",
      error?.response?.data?.message || "Não foi possível criar o lembrete."
    );
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <>
          <PageHeader title="Novo lembrete" subtitle="Configure data, hora e contexto" onMenu={isWide ? undefined : openMenu} right={<Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></Pressable>} />

          <Card>
            <Input label="ID do cronograma" placeholder="ID do cronograma" value={scheduleId} onChangeText={setScheduleId} editable={!params.scheduleId} />
            <Input label="Título" placeholder="Ex: Tomar remédio" value={title} onChangeText={setTitle} />
            <Input label="Descrição" placeholder="Ex: Tomar após alimentação" value={description} onChangeText={setDescription} multiline />
            <Input label="Data e hora" placeholder="YYYY-MM-DDTHH:mm" value={dateTime} onChangeText={setDateTime} />
            <Button title="Criar lembrete" onPress={handleCreate} loading={isSubmitting} style={{ marginTop: spacing.lg }} />
          </Card>
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontWeight: "900" }
});
