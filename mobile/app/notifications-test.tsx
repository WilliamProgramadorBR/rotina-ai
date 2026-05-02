import { router } from "expo-router";
import { useState, useEffect } from "react";
import { 
  Alert, 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform
} from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  configureNotificationSystem,
  scheduleTestNotification,
} from "@/services/notifications";
import * as Notifications from "expo-notifications";

type PermissionStatus = "undetermined" | "granted" | "denied";

export default function NotificationsTestScreen() {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("undetermined");
  const { width } = useWindowDimensions();
  
  // Padding responsivo baseado na largura
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

  function getStatusColor() {
    switch (permissionStatus) {
      case "granted":
        return "#22C55E";
      case "denied":
        return "#EF4444";
      default:
        return "#F59E0B";
    }
  }

  function getStatusText() {
    switch (permissionStatus) {
      case "granted":
        return "Permitido";
      case "denied":
        return "Negado";
      default:
        return "Não verificado";
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text 
            style={styles.back} 
            onPress={() => router.back()}
            accessible
            accessibilityRole="button"
          >
            ← Voltar
          </Text>
          <Text style={styles.title}>Teste de notificação</Text>
          <Text style={styles.subtitle}>
            Valide se o celular está recebendo os lembretes do app.
          </Text>
        </View>

        {/* Card de status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status da permissão</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            {permissionStatus === "granted" 
              ? "As notificações estão ativadas e funcionando corretamente."
              : permissionStatus === "denied"
              ? "Você precisa liberar as notificações nas configurações do dispositivo."
              : "Clique em 'Liberar permissão' para verificar o status."
            }
          </Text>
        </Card>

        {/* Card de validacao */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Validação rápida</Text>
          <Text style={styles.cardText}>
            Primeiro libere a permissão. Depois envie uma notificação de teste. 
            {Platform.OS === "android" && " No Android 13 ou superior, a permissão só aparece corretamente depois que o app cria um canal de notificação."}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Liberar permissão"
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

        {/* Card de saude das notificacoes */}
        <Card style={styles.healthCard}>
          <Text style={styles.cardTitle}>Saúde das notificações</Text>
          
          <View style={styles.healthList}>
            <View style={styles.healthItem}>
              <View style={[
                styles.healthIcon, 
                { backgroundColor: permissionStatus === "granted" ? "#22C55E20" : "#F59E0B20" }
              ]}>
                <Text style={styles.healthIconText}>
                  {permissionStatus === "granted" ? "✓" : "!"}
                </Text>
              </View>
              <View style={styles.healthInfo}>
                <Text style={styles.healthTitle}>Permissão do sistema</Text>
                <Text style={styles.healthDescription}>
                  {permissionStatus === "granted" 
                    ? "Notificações permitidas pelo sistema"
                    : "Aguardando liberação"
                  }
                </Text>
              </View>
            </View>

            <View style={styles.healthDivider} />

            <View style={styles.healthItem}>
              <View style={[styles.healthIcon, { backgroundColor: "#3B82F620" }]}>
                <Text style={styles.healthIconText}>◔</Text>
              </View>
              <View style={styles.healthInfo}>
                <Text style={styles.healthTitle}>Canal de notificação</Text>
                <Text style={styles.healthDescription}>
                  Canal padrão configurado para lembretes
                </Text>
              </View>
            </View>

            <View style={styles.healthDivider} />

            <View style={styles.healthItem}>
              <View style={[styles.healthIcon, { backgroundColor: "#8B5CF620" }]}>
                <Text style={styles.healthIconText}>◷</Text>
              </View>
              <View style={styles.healthInfo}>
                <Text style={styles.healthTitle}>Agendamento</Text>
                <Text style={styles.healthDescription}>
                  Sistema de alarmes pronto para uso
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Dicas */}
        <Card style={styles.tipsCard}>
          <Text style={styles.cardTitle}>Dicas de uso</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Mantenha o app atualizado</Text>
            <Text style={styles.tipItem}>• Não force o fechamento do app</Text>
            <Text style={styles.tipItem}>• Verifique se o modo "Não perturbe" está desativado</Text>
            <Text style={styles.tipItem}>• Permita que o app rode em segundo plano</Text>
          </View>
        </Card>

        {/* Espaco extra no final para scroll confortavel */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A"
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 40
  },
  
  // Header
  header: {
    marginBottom: 24
  },
  back: {
    color: "#93C5FD",
    marginBottom: 16,
    fontWeight: "800",
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: "center"
  },
  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22
  },
  
  // Cards
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
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8
  },
  cardText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16
  },
  
  // Status card
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  statusTitle: {
    color: "#F8FAFC",
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
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20
  },
  
  // Buttons
  buttonContainer: {
    gap: 12
  },
  button: {
    width: "100%",
    minHeight: 48
  },
  
  // Health card
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
    fontSize: 18,
    color: "#F8FAFC"
  },
  healthInfo: {
    flex: 1,
    minWidth: 0
  },
  healthTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700"
  },
  healthDescription: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2
  },
  healthDivider: {
    height: 1,
    backgroundColor: "#1F2937",
    marginLeft: 56
  },
  
  // Tips
  tipsList: {
    marginTop: 4,
    gap: 8
  },
  tipItem: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20
  },
  
  bottomSpacer: {
    height: 20
  }
});
