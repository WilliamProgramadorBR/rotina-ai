import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import * as Notifications from "expo-notifications";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useThemeMode } from "@/context/ThemeContext";
import {
  configureNotificationSystem,
  scheduleTestNotification
} from "@/services/notifications";

type PermissionStatus = "undetermined" | "granted" | "denied";

export default function NotificationsTestScreen() {
  const { theme } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("undetermined");
  const { width } = useWindowDimensions();

  const horizontalPadding = width < 360 ? 12 : width < 400 ? 16 : 20;

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  async function checkPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
    } catch {
      setPermissionStatus("undetermined");
    }
  }

  async function handleRequestPermission() {
    try {
      setLoading(true);
      const granted = await configureNotificationSystem();

      setPermissionStatus(granted ? "granted" : "denied");

      Alert.alert(
        granted ? "Permissao liberada" : "Permissao negada",
        granted
          ? "O app ja pode exibir notificacoes."
          : "Libere as notificacoes nas configuracoes do Android/iOS para receber lembretes."
      );
    } catch {
      Alert.alert("Erro", "Nao foi possivel solicitar a permissao de notificacao.");
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
          "Nao agendado",
          "A notificacao de teste nao foi agendada. Verifique a permissao do app."
        );
        return;
      }

      Alert.alert("Teste agendado", "Voce deve receber uma notificacao em aproximadamente 5 segundos.");
    } catch {
      Alert.alert("Erro", "Nao foi possivel agendar a notificacao de teste.");
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor() {
    switch (permissionStatus) {
      case "granted":
        return theme.success;
      case "denied":
        return theme.danger;
      default:
        return theme.warning;
    }
  }

  function getStatusText() {
    switch (permissionStatus) {
      case "granted":
        return "Permitido";
      case "denied":
        return "Negado";
      default:
        return "Nao verificado";
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[styles.back, { color: theme.primary }]}
            onPress={() => router.back()}
            accessible
            accessibilityRole="button"
          >
            Voltar
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>Teste de notificacao</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Valide se o celular esta recebendo os lembretes do app.
          </Text>
        </View>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusTitle, { color: theme.text }]}>Status da permissao</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          <Text style={[styles.statusDescription, { color: theme.textMuted }]}>
            {permissionStatus === "granted"
              ? "As notificacoes estao ativadas e funcionando corretamente."
              : permissionStatus === "denied"
              ? "Voce precisa liberar as notificacoes nas configuracoes do dispositivo."
              : "Clique em 'Liberar permissao' para verificar o status."}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Validacao rapida</Text>
          <Text style={[styles.cardText, { color: theme.textMuted }]}>
            Primeiro libere a permissao. Depois envie uma notificacao de teste.
            {Platform.OS === "android" &&
              " No Android 13 ou superior, a permissao so aparece corretamente depois que o app cria um canal de notificacao."}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Liberar permissao"
              onPress={handleRequestPermission}
              loading={loading}
              style={styles.button}
            />

            <Button
              title="Enviar teste em 5 segundos"
              variant="secondary"
              onPress={handleTestNotification}
              loading={loading}
              disabled={permissionStatus !== "granted"}
              style={styles.button}
            />
          </View>
        </Card>

        <Card style={styles.healthCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Saude das notificacoes</Text>

          <View style={styles.healthList}>
            <HealthItem
              badge="OK"
              color={permissionStatus === "granted" ? theme.success : theme.warning}
              title="Permissao do sistema"
              description={permissionStatus === "granted" ? "Notificacoes permitidas pelo sistema" : "Aguardando liberacao"}
            />

            <View style={[styles.healthDivider, { backgroundColor: theme.border }]} />

            <HealthItem
              badge="CH"
              color={theme.primary}
              title="Canal de notificacao"
              description="Canal padrao configurado para lembretes"
            />

            <View style={[styles.healthDivider, { backgroundColor: theme.border }]} />

            <HealthItem
              badge="AG"
              color={theme.accent}
              title="Agendamento"
              description="Sistema de alarmes pronto para uso"
            />
          </View>
        </Card>

        <Card style={styles.tipsCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Dicas de uso</Text>
          <View style={styles.tipsList}>
            {[
              "Mantenha o app atualizado",
              "Nao force o fechamento do app",
              'Verifique se o modo "Nao perturbe" esta desativado',
              "Permita que o app rode em segundo plano"
            ].map((tip) => (
              <Text key={tip} style={[styles.tipItem, { color: theme.textMuted }]}>
                - {tip}
              </Text>
            ))}
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );

  function HealthItem({
    badge,
    color,
    title,
    description
  }: {
    badge: string;
    color: string;
    title: string;
    description: string;
  }) {
    return (
      <View style={styles.healthItem}>
        <View style={[styles.healthIcon, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.healthIconText, { color }]}>{badge}</Text>
        </View>
        <View style={styles.healthInfo}>
          <Text style={[styles.healthTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.healthDescription, { color: theme.textMuted }]}>{description}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40
  },
  header: {
    marginBottom: 24
  },
  back: {
    marginBottom: 16,
    fontWeight: "800",
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    marginBottom: 16,
    padding: 16
  },
  statusCard: {
    marginBottom: 16,
    padding: 16
  },
  healthCard: {
    marginBottom: 16,
    padding: 16
  },
  tipsCard: {
    marginBottom: 16,
    padding: 16
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700"
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20
  },
  buttonContainer: {
    gap: 12
  },
  button: {
    width: "100%",
    minHeight: 48
  },
  healthList: {
    marginTop: 8
  },
  healthItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12
  },
  healthIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  healthIconText: {
    fontSize: 13,
    fontWeight: "900"
  },
  healthInfo: {
    flex: 1,
    minWidth: 0
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: "700"
  },
  healthDescription: {
    fontSize: 13,
    marginTop: 2
  },
  healthDivider: {
    height: 1,
    marginLeft: 56
  },
  tipsList: {
    marginTop: 4,
    gap: 8
  },
  tipItem: {
    fontSize: 14,
    lineHeight: 20
  },
  bottomSpacer: {
    height: 20
  }
});
