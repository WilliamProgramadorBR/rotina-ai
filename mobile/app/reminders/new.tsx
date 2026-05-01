import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { getApiErrorMessage } from "@/services/api";
import { createReminderRequest } from "@/services/reminders";
import { scheduleReminderNotification } from "@/services/notifications";
import { buildISOFromDateAndTime, todayDateInputValue } from "@/utils/date";

export default function NewReminderScreen() {
  const { scheduleId } = useLocalSearchParams<{ scheduleId: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState(todayDateInputValue());
  const [timeValue, setTimeValue] = useState("08:00");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    try {
      if (!scheduleId) {
        Alert.alert("Erro", "Cronograma não informado.");
        return;
      }

      if (!title.trim()) {
        Alert.alert("Atenção", "Informe um título para o lembrete.");
        return;
      }

      setLoading(true);

      const reminder = await createReminderRequest({
        scheduleId,
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: buildISOFromDateAndTime(dateValue, timeValue),
        timezone: "America/Sao_Paulo",
      });

      const notificationId = await scheduleReminderNotification(reminder);

      if (!notificationId) {
        Alert.alert(
          "Lembrete salvo",
          "O lembrete foi criado, mas a notificação não foi agendada. Verifique se a data está no futuro e se a permissão de notificação foi liberada."
        );
      }

      router.replace(`/schedules/${scheduleId}`);
    } catch (error) {
      Alert.alert("Erro", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>← Voltar</Text>
        <Text style={styles.title}>Novo lembrete</Text>
        <Text style={styles.subtitle}>Defina o que precisa ser lembrado e em qual horário.</Text>
      </View>

      <View style={styles.form}>
        <Input label="Título" value={title} onChangeText={setTitle} placeholder="Ex: Tomar remédio" />
        <Input
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Tomar após alimentação"
          multiline
          style={styles.textarea}
        />
        <Input
          label="Data"
          value={dateValue}
          onChangeText={setDateValue}
          placeholder="AAAA-MM-DD"
          autoCapitalize="none"
        />
        <Input
          label="Horário"
          value={timeValue}
          onChangeText={setTimeValue}
          placeholder="HH:mm"
          autoCapitalize="none"
        />

        <Button title="Salvar lembrete" onPress={handleCreate} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  back: {
    color: "#93C5FD",
    marginBottom: 12,
    fontWeight: "800",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: 14,
  },
});
