import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, SectionTitle } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { colors, fonts, radius, shadow, spacing } from "../src/theme";
import { configureAlarmNotifications, requestAlarmNotificationPermission, scheduleReminderAlarm } from "../src/services/alarmNotifications";

export default function SettingsScreen() {
  async function handleTestAlarm() {
    try {
      await configureAlarmNotifications();
      const allowed = await requestAlarmNotificationPermission();

      if (!allowed) {
        Alert.alert("Permissão necessária", "Permita notificações para testar o alarme.");
        return;
      }

      const startAt = new Date(Date.now() + 10 * 1000).toISOString();
      await scheduleReminderAlarm({
        reminderId: "test-alarm",
        title: "Teste de alarme",
        description: "Se você recebeu isso, o modo alarme está funcionando.",
        startAt,
        scheduleTitle: "Configurações"
      });

      Alert.alert("Teste agendado", "Um alarme de teste aparecerá em aproximadamente 10 segundos.");
    } catch (error: any) {
      console.log("[TEST ALARM ERROR]", error);
      Alert.alert("Erro", error?.message || "Não foi possível testar o alarme.");
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Teste de notificação"
            subtitle="Valide permissões e garanta que seus alarmes sejam entregues"
            onMenu={isWide ? undefined : openMenu}
            right={<Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>Voltar</Text></Pressable>}
          />

          <View style={styles.grid}>
            <View style={styles.leftColumn}>
              <Card style={styles.validationCard}>
                <SectionTitle title="Validação rápida" subtitle="Teste instantaneamente o envio de uma notificação em seu dispositivo." />
                <View style={styles.statusGrid}>
                  <View style={styles.statusBox}><Text style={styles.statusLabel}>Status do serviço</Text><Text style={styles.statusGood}>Operacional</Text><Text style={styles.statusSub}>Todos os sistemas funcionando</Text></View>
                  <View style={styles.statusBox}><Text style={styles.statusLabel}>Permissão atual</Text><Text style={styles.statusWarn}>Verificar</Text><Text style={styles.statusSub}>Necessária para enviar alarmes</Text></View>
                </View>
                <View style={styles.actionsRow}>
                  <Button title="Liberar permissão" variant="secondary" onPress={requestAlarmNotificationPermission as any} style={styles.actionButton} />
                  <Button title="Enviar teste em 10 segundos" variant="ai" onPress={handleTestAlarm} style={styles.actionButton} />
                </View>
                <View style={styles.infoStrip}><Text style={styles.infoStripText}>ⓘ As notificações são locais deste dispositivo e não ficam salvas em nuvem.</Text></View>
              </Card>

              <Card style={styles.alarmPreviewCard}>
                <SectionTitle title="Alarme de teste" subtitle="Prévia da notificação que será enviada para você." />
                <View style={styles.previewRow}>
                  <View style={styles.notificationPreview}>
                    <View style={styles.previewIcon}><Text style={styles.previewIconText}>AI</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewApp}>Rotina AI <Text style={styles.previewNow}>agora</Text></Text>
                      <Text style={styles.previewTitle}>◔ Este é um alarme de teste</Text>
                      <Text style={styles.previewText}>Se você está vendo esta mensagem, suas notificações estão funcionando.</Text>
                    </View>
                  </View>
                  <View style={styles.timeline}>
                    <Text style={styles.timelineItem}>00s  Enviando notificação...</Text>
                    <Text style={styles.timelineItem}>02s  Entregando ao dispositivo...</Text>
                    <Text style={styles.timelineItem}>04s  Exibindo notificação ◔</Text>
                    <Text style={[styles.timelineItem, styles.timelineDone]}>10s  Concluído!</Text>
                  </View>
                </View>
              </Card>
            </View>

            <View style={styles.rightColumn}>
              <Card style={styles.healthCard}>
                <SectionTitle title="Saúde das notificações" subtitle="Acompanhe o status do sistema de notificações no dispositivo." />
                <Metric label="Canal ativo" value="Local notifications" tone="green" />
                <Metric label="Último teste" value="Aguardando validação" tone="blue" />
                <Metric label="Permissões" value="Verificar no Android" tone="orange" />
                <Metric label="Taxa de entrega" value="100% em testes locais" tone="green" />
              </Card>

              <Card style={styles.helpCard}>
                <Text style={styles.helpTitle}>Precisa de ajuda?</Text>
                <Text style={styles.helpText}>Faça testes regulares após instalar uma nova build ou alterar permissões do Android.</Text>
                <Button title="Voltar para início" variant="secondary" onPress={() => router.push("/home")} style={{ marginTop: spacing.lg }} />
              </Card>
            </View>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" | "orange" }) {
  const color = tone === "green" ? colors.success : tone === "orange" ? colors.warning : colors.primary;
  return (
    <View style={styles.metric}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { height: 42, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.text, fontFamily: fonts.bold },
  grid: { flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" },
  leftColumn: { flex: 1.7, gap: spacing.lg },
  rightColumn: { flex: 0.78, gap: spacing.lg },
  validationCard: { padding: spacing.xl, borderColor: "#C7D7FE" },
  statusGrid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statusBox: { flex: 1, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, padding: spacing.lg },
  statusLabel: { color: colors.textMuted, fontFamily: fonts.medium },
  statusGood: { color: colors.success, fontFamily: fonts.title, fontSize: 22, marginTop: 4 },
  statusWarn: { color: colors.warning, fontFamily: fonts.title, fontSize: 22, marginTop: 4 },
  statusSub: { color: colors.textMuted, fontFamily: fonts.regular, marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: spacing.md },
  actionButton: { flex: 1 },
  infoStrip: { marginTop: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primarySoft, padding: spacing.md },
  infoStripText: { color: colors.primaryDark, fontFamily: fonts.medium },
  alarmPreviewCard: { padding: spacing.xl },
  previewRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  notificationPreview: { flex: 1, flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  previewIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  previewIconText: { color: colors.accent, fontFamily: fonts.title },
  previewApp: { color: colors.textMuted, fontFamily: fonts.medium },
  previewNow: { color: colors.textSoft },
  previewTitle: { color: colors.text, fontFamily: fonts.title, fontSize: 16, marginTop: 4 },
  previewText: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 20, marginTop: 4 },
  timeline: { width: 260, gap: spacing.sm },
  timelineItem: { color: colors.textMuted, fontFamily: fonts.medium },
  timelineDone: { color: colors.success, fontFamily: fonts.bold },
  healthCard: { padding: spacing.xl },
  metric: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, padding: spacing.md, marginBottom: spacing.md },
  metricDot: { width: 10, height: 10, borderRadius: 5 },
  metricLabel: { color: colors.text, fontFamily: fonts.bold },
  metricValue: { color: colors.textMuted, fontFamily: fonts.regular, marginTop: 3 },
  helpCard: { padding: spacing.xl },
  helpTitle: { color: colors.text, fontFamily: fonts.title, fontSize: 20 },
  helpText: { color: colors.textMuted, fontFamily: fonts.regular, lineHeight: 22, marginTop: spacing.sm }
});
