import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import {
  configureNotificationSystem,
  scheduleTestNotification,
} from "@/services/notifications";

export default function NotificationsTestScreen() {
  const [loading, setLoading] = useState(false);

  async function handleRequestPermission() {
    try {
      setLoading(true);
      const granted = await configureNotificationSystem();

      Alert.alert(
        granted ? "Permissão liberada" : "Permissão negada",
        granted
          ? "O app já pode exibir notificações."
          : "Libere as notificações nas configurações do Android/iOS para receber lembretes."
      );
    } catch {
      Alert.alert("Erro", "Não foi possível solicitar a permissão de notificação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTestNotification() {
    try {
      setLoading(true);
      const id = await scheduleTestNotification();

      if (!id) {
        Alert.alert(
          "Não agendado",
          "A notificação de teste não foi agendada. Verifique a permissão do app."
        );
        return;
      }

      Alert.alert("Teste agendado", "Você deve receber uma notificação em aproximadamente 5 segundos.");
    } catch {
      Alert.alert("Erro", "Não foi possível agendar a notificação de teste.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>← Voltar</Text>
        <Text style={styles.title}>Teste de notificação</Text>
        <Text style={styles.subtitle}>
          Use esta tela para validar se o celular está recebendo os lembretes do app.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Validação rápida</Text>
        <Text style={styles.cardText}>
          Primeiro libere a permissão. Depois envie uma notificação de teste. No Android 13 ou superior, a permissão só aparece corretamente depois que o app cria um canal de notificação.
        </Text>

        <Button
          title="Liberar permissão"
          onPress={handleRequestPermission}
          loading={loading}
        />

        <Button
          title="Enviar teste em 5 segundos"
          variant="secondary"
          onPress={handleTestNotification}
          loading={loading}
        />
      </Card>
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
  card: {
    gap: 14,
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
  },
  cardText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
});
