import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Button, Card, Input, SectionTitle } from "../src/components/ui";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { configureAlarmNotifications, requestAlarmNotificationPermission, scheduleReminderAlarm } from "../src/services/alarmNotifications";
import { useResponsive } from "../src/hooks/useResponsive";
import { getApiBaseUrl, getDefaultApiBaseUrl, resetApiBaseUrl, saveApiBaseUrl } from "../src/services/api";
import {
  clearCustomRingtone,
  getCustomRingtone,
  pickCustomRingtone,
  playAlarmRingtone,
  stopAlarmRingtone
} from "../src/services/customRingtone";
import type { CustomRingtone } from "../src/services/customRingtone";
import { getDashboardMetricsRequest } from "../src/services/metrics";
import { DashboardMetrics } from "../src/types/api";

export default function SettingsScreen() {
  const { width, isPhone, isSmallPhone, gap } = useResponsive();
  const isMobile = isPhone || isSmallPhone;
  const [apiUrl, setApiUrl] = useState(getDefaultApiBaseUrl());
  const [isSavingApiUrl, setIsSavingApiUrl] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardMetrics["summary"] | null>(null);
  const [customRingtone, setCustomRingtone] = useState<CustomRingtone | null>(null);
  const [isPickingRingtone, setIsPickingRingtone] = useState(false);
  const [isPreviewingRingtone, setIsPreviewingRingtone] = useState(false);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getApiBaseUrl().then(setApiUrl);
    getCustomRingtone().then(setCustomRingtone);
    getDashboardMetricsRequest()
      .then((metrics) => setDashboardSummary(metrics.summary))
      .catch((error) => console.log("[SETTINGS METRICS ERROR]", error?.response?.data || error));

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }

      stopAlarmRingtone();
    };
  }, []);

  async function handleTestAlarm() {
    try {
      await configureAlarmNotifications();
      const allowed = await requestAlarmNotificationPermission();

      if (!allowed) {
        Alert.alert("Permissao necessaria", "Permita notificacoes para testar o alarme.");
        return;
      }

      const startAt = new Date(Date.now() + 10 * 1000).toISOString();
      await scheduleReminderAlarm({
        reminderId: "test-alarm",
        title: "Teste de alarme",
        description: "Se voce recebeu isso, o modo alarme esta funcionando.",
        startAt,
        scheduleTitle: "Configuracoes"
      });

      Alert.alert("Teste agendado", "Um alarme de teste aparecera em aproximadamente 10 segundos.");
    } catch (error: any) {
      console.log("[TEST ALARM ERROR]", error);
      Alert.alert("Erro", error?.message || "Nao foi possivel testar o alarme.");
    }
  }

  async function handleSaveApiUrl() {
    try {
      setIsSavingApiUrl(true);
      const savedUrl = await saveApiBaseUrl(apiUrl);
      setApiUrl(savedUrl);
      Alert.alert("URL salva", "As proximas chamadas usarao este servidor.");
    } catch (error: any) {
      Alert.alert("URL invalida", error?.message || "Nao foi possivel salvar a URL da API.");
    } finally {
      setIsSavingApiUrl(false);
    }
  }

  async function handleResetApiUrl() {
    try {
      setIsSavingApiUrl(true);
      const defaultUrl = await resetApiBaseUrl();
      setApiUrl(defaultUrl);
      Alert.alert("URL restaurada", "O app voltou a usar a URL padrao.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel restaurar a URL padrao.");
    } finally {
      setIsSavingApiUrl(false);
    }
  }

  async function handlePickRingtone() {
    try {
      setIsPickingRingtone(true);
      const ringtone = await pickCustomRingtone();

      if (ringtone) {
        setCustomRingtone(ringtone);
        Alert.alert("Toque salvo", "O novo audio foi salvo.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel salvar o toque.");
    } finally {
      setIsPickingRingtone(false);
    }
  }

  async function handleTogglePreviewRingtone() {
    try {
      if (isPreviewingRingtone) {
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }

        await stopAlarmRingtone();
        setIsPreviewingRingtone(false);
        return;
      }

      const ringtone = await playAlarmRingtone();

      if (!ringtone) {
        Alert.alert("Sem toque", "Escolha um audio primeiro.");
        return;
      }

      setIsPreviewingRingtone(true);
      previewTimeoutRef.current = setTimeout(() => {
        stopAlarmRingtone();
        setIsPreviewingRingtone(false);
        previewTimeoutRef.current = null;
      }, 8000);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel tocar o audio.");
    }
  }

  async function handleClearRingtone() {
    try {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }

      await clearCustomRingtone();
      setCustomRingtone(null);
      setIsPreviewingRingtone(false);
      Alert.alert("Toque removido", "O alarme voltou ao som padrao.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel remover o toque.");
    }
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Teste de notificacao"
            subtitle="Valide permissoes e garanta que seus alarmes sejam entregues"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable 
                style={[styles.backButton, isSmallPhone && styles.backButtonSmall]} 
                onPress={() => router.back()}
              >
                <Text style={[styles.backText, { fontSize: scaledFont(13, width) }]}>Voltar</Text>
              </Pressable>
            }
          />

          <View style={[styles.grid, isMobile && styles.gridMobile]}>
            {/* Left Column */}
            <View style={[styles.leftColumn, isMobile && styles.columnMobile, { gap }]}>
              {/* Validation Card */}
              <Card style={[styles.validationCard, isMobile && styles.validationCardMobile]}>
                <SectionTitle 
                  title="Validacao rapida" 
                  subtitle="Teste instantaneamente o envio de uma notificacao em seu dispositivo." 
                />
                <View style={[styles.statusGrid, isMobile && styles.statusGridMobile, { gap: spacing.sm }]}>
                  <View style={[styles.statusBox, isMobile && styles.statusBoxMobile]}>
                    <Text style={[styles.statusLabel, { fontSize: scaledFont(12, width) }]}>Status do servico</Text>
                    <Text style={[styles.statusGood, { fontSize: scaledFont(isMobile ? 18 : 20, width) }]}>Operacional</Text>
                    <Text style={[styles.statusSub, { fontSize: scaledFont(11, width) }]}>Todos os sistemas ok</Text>
                  </View>
                  <View style={[styles.statusBox, isMobile && styles.statusBoxMobile]}>
                    <Text style={[styles.statusLabel, { fontSize: scaledFont(12, width) }]}>Permissao atual</Text>
                    <Text style={[styles.statusWarn, { fontSize: scaledFont(isMobile ? 18 : 20, width) }]}>Verificar</Text>
                    <Text style={[styles.statusSub, { fontSize: scaledFont(11, width) }]}>Necessaria para alarmes</Text>
                  </View>
                </View>
                <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile, { gap: spacing.sm }]}>
                  <Button 
                    title="Liberar permissao" 
                    variant="secondary" 
                    onPress={requestAlarmNotificationPermission as any} 
                    style={styles.actionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button 
                    title={isMobile ? "Testar alarme" : "Enviar teste em 10s"} 
                    variant="ai" 
                    onPress={handleTestAlarm} 
                    style={styles.actionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
                <View style={[styles.infoStrip, isMobile && styles.infoStripMobile]}>
                  <Text style={[styles.infoStripText, { fontSize: scaledFont(12, width) }]}>
                    i As notificacoes sao locais deste dispositivo e nao ficam salvas em nuvem.
                  </Text>
                </View>
              </Card>

              {/* Alarm Preview Card */}
              <Card style={[styles.alarmPreviewCard, isMobile && styles.alarmPreviewCardMobile]}>
                <SectionTitle 
                  title="Alarme de teste" 
                  subtitle="Previa da notificacao que sera enviada." 
                />
                <View style={[styles.previewRow, isMobile && styles.previewRowMobile]}>
                  <View style={[styles.notificationPreview, isMobile && styles.notificationPreviewMobile]}>
                    <View style={[styles.previewIcon, isMobile && styles.previewIconMobile]}>
                      <Text style={[styles.previewIconText, { fontSize: scaledFont(isMobile ? 14 : 16, width) }]}>AI</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.previewApp, { fontSize: scaledFont(12, width) }]}>
                        Rotina AI <Text style={styles.previewNow}>agora</Text>
                      </Text>
                      <Text style={[styles.previewTitle, { fontSize: scaledFont(14, width) }]}>
                        Este e um alarme de teste
                      </Text>
                      <Text style={[styles.previewText, { fontSize: scaledFont(12, width) }]}>
                        Se voce esta vendo esta mensagem, suas notificacoes estao funcionando.
                      </Text>
                    </View>
                  </View>
                  {!isMobile && (
                    <View style={styles.timeline}>
                      <Text style={styles.timelineItem}>00s  Enviando notificacao...</Text>
                      <Text style={styles.timelineItem}>02s  Entregando ao dispositivo...</Text>
                      <Text style={styles.timelineItem}>04s  Exibindo notificacao</Text>
                      <Text style={[styles.timelineItem, styles.timelineDone]}>10s  Concluido!</Text>
                    </View>
                  )}
                </View>
              </Card>
            </View>

            {/* Right Column */}
            <View style={[styles.rightColumn, isMobile && styles.columnMobile, { gap }]}>
              {/* Health Card */}
              <Card style={[styles.healthCard, isMobile && styles.healthCardMobile]}>
                <SectionTitle 
                  title="Saude das notificacoes" 
                  subtitle="Status do sistema de notificacoes." 
                />
                <Metric label="Canal ativo" value="Local notifications" tone="green" width={width} isMobile={isMobile} />
                <Metric label="Ultimo teste" value="Aguardando validacao" tone="blue" width={width} isMobile={isMobile} />
                <Metric label="Permissoes" value="Verificar no Android" tone="orange" width={width} isMobile={isMobile} />
                <Metric label="Conclusao geral" value={`${dashboardSummary?.completionRate ?? 0}% dos vencidos`} tone="green" width={width} isMobile={isMobile} />
              </Card>

              <Card style={[styles.ringtoneCard, isMobile && styles.ringtoneCardMobile]}>
                <SectionTitle
                  title="Toque do alarme"
                  subtitle="Audio personalizado para alarmes ativos."
                />
                <View style={styles.ringtoneInfo}>
                  <Text style={[styles.ringtoneLabel, { fontSize: scaledFont(12, width) }]}>Arquivo atual</Text>
                  <Text style={[styles.ringtoneName, { fontSize: scaledFont(14, width) }]} numberOfLines={2}>
                    {customRingtone?.name || "Som padrao"}
                  </Text>
                </View>
                <View style={[styles.ringtoneActions, isMobile && styles.ringtoneActionsMobile]}>
                  <Button
                    title={customRingtone ? "Trocar audio" : "Escolher audio"}
                    variant="ai"
                    onPress={handlePickRingtone}
                    loading={isPickingRingtone}
                    style={styles.ringtoneActionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title={isPreviewingRingtone ? "Parar" : "Ouvir"}
                    variant="secondary"
                    onPress={handleTogglePreviewRingtone}
                    disabled={!customRingtone || isPickingRingtone}
                    style={styles.ringtoneActionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title="Remover"
                    variant="danger"
                    onPress={handleClearRingtone}
                    disabled={!customRingtone || isPickingRingtone}
                    style={styles.ringtoneActionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
              </Card>

              {/* Help Card */}
              <Card style={[styles.helpCard, isMobile && styles.helpCardMobile]}>
                <Text style={[styles.helpTitle, { fontSize: scaledFont(isMobile ? 16 : 18, width) }]}>
                  Precisa de ajuda?
                </Text>
                <Text style={[styles.helpText, { fontSize: scaledFont(13, width) }]}>
                  Faca testes regulares apos instalar uma nova build ou alterar permissoes do Android.
                </Text>
                <Button 
                  title="Voltar para inicio" 
                  variant="secondary" 
                  onPress={() => router.push("/home")} 
                  style={{ marginTop: spacing.md }}
                  size={isMobile ? "md" : "lg"}
                  fullWidth
                />
              </Card>

              {/* API Connection Card */}
              <Card style={[styles.apiCard, isMobile && styles.apiCardMobile]}>
                <SectionTitle
                  title="Conexao da API"
                  subtitle="Troque a URL do backend sem instalar um novo APK."
                />
                <Input
                  label="URL do servidor"
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  size={isMobile ? "sm" : "md"}
                  hint={`Padrao: ${getDefaultApiBaseUrl()}`}
                />
                <View style={[styles.apiActions, isMobile && styles.apiActionsMobile]}>
                  <Button
                    title="Salvar URL"
                    variant="ai"
                    onPress={handleSaveApiUrl}
                    loading={isSavingApiUrl}
                    style={styles.apiActionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title="Usar padrao"
                    variant="secondary"
                    onPress={handleResetApiUrl}
                    disabled={isSavingApiUrl}
                    style={styles.apiActionButton}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
              </Card>

              {/* Credits Card */}
              <Card style={[styles.creditsCard, isMobile && styles.creditsCardMobile]}>
                <Text style={[styles.creditsTitle, { fontSize: scaledFont(isMobile ? 16 : 18, width) }]}>
                  Sobre o App
                </Text>
                <Text style={[styles.creditsText, { fontSize: scaledFont(13, width) }]}>
                  Rotina AI - Gerenciador de Rotinas Inteligente
                </Text>
                <Text style={[styles.creditsText, { fontSize: scaledFont(12, width) }]}>
                  Criador: William Oliveira Dos Santos
                </Text>
                <Text style={[styles.creditsText, { fontSize: scaledFont(12, width) }]}>
                  Contato: william100william@gmail.com
                </Text>
                <Text style={[styles.creditsText, { fontSize: scaledFont(12, width) }]}>
                  Conta Expo: williamdevbackend
                </Text>
                <Text style={[styles.creditsText, { fontSize: scaledFont(12, width) }]}>
                  Versao 1.2.0
                </Text>
              </Card>
            </View>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

function Metric({ 
  label, 
  value, 
  tone,
  width,
  isMobile
}: { 
  label: string; 
  value: string; 
  tone: "green" | "blue" | "orange";
  width: number;
  isMobile: boolean;
}) {
  const color = tone === "green" ? colors.success : tone === "orange" ? colors.warning : colors.primary;
  return (
    <View style={[styles.metric, isMobile && styles.metricMobile]}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.metricLabel, { fontSize: scaledFont(13, width) }]}>{label}</Text>
        <Text style={[styles.metricValue, { fontSize: scaledFont(12, width) }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { 
    height: 40, 
    paddingHorizontal: spacing.md, 
    borderRadius: radius.md, 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  backButtonSmall: {
    height: 36,
    paddingHorizontal: spacing.sm
  },
  backText: { 
    color: colors.text, 
    fontFamily: fonts.bold 
  },
  
  grid: { 
    flexDirection: "row", 
    gap: spacing.xl, 
    alignItems: "flex-start" 
  },
  gridMobile: {
    flexDirection: "column",
    gap: spacing.md
  },
  
  leftColumn: { 
    flex: 1.7 
  },
  rightColumn: { 
    flex: 0.78 
  },
  columnMobile: {
    flex: 1,
    width: "100%"
  },
  
  validationCard: { 
    padding: spacing.lg, 
    borderColor: "#C7D7FE" 
  },
  validationCardMobile: {
    padding: spacing.md
  },
  
  statusGrid: { 
    flexDirection: "row", 
    marginBottom: spacing.md 
  },
  statusGridMobile: {
    flexDirection: "column"
  },
  
  statusBox: { 
    flex: 1, 
    borderRadius: radius.lg, 
    borderWidth: 1, 
    borderColor: colors.border, 
    backgroundColor: colors.surfaceMuted, 
    padding: spacing.md 
  },
  statusBoxMobile: {
    padding: spacing.sm
  },
  
  statusLabel: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium 
  },
  statusGood: { 
    color: colors.success, 
    fontFamily: fonts.title, 
    marginTop: 4 
  },
  statusWarn: { 
    color: colors.warning, 
    fontFamily: fonts.title, 
    marginTop: 4 
  },
  statusSub: { 
    color: colors.textMuted, 
    fontFamily: fonts.regular, 
    marginTop: 4 
  },
  
  actionsRow: { 
    flexDirection: "row" 
  },
  actionsRowMobile: {
    flexDirection: "column"
  },
  actionButton: { 
    flex: 1 
  },
  
  infoStrip: { 
    marginTop: spacing.md, 
    borderRadius: radius.md, 
    backgroundColor: colors.primarySoft, 
    padding: spacing.md 
  },
  infoStripMobile: {
    padding: spacing.sm
  },
  infoStripText: { 
    color: colors.primaryDark, 
    fontFamily: fonts.medium 
  },
  
  alarmPreviewCard: { 
    padding: spacing.lg 
  },
  alarmPreviewCardMobile: {
    padding: spacing.md
  },
  
  previewRow: { 
    flexDirection: "row", 
    gap: spacing.lg, 
    alignItems: "center" 
  },
  previewRowMobile: {
    flexDirection: "column",
    alignItems: "stretch"
  },
  
  notificationPreview: { 
    flex: 1, 
    flexDirection: "row", 
    gap: spacing.md, 
    alignItems: "center", 
    backgroundColor: colors.surfaceMuted, 
    borderRadius: radius.lg, 
    padding: spacing.md, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  notificationPreviewMobile: {
    padding: spacing.sm
  },
  
  previewIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: colors.accentSoft, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  previewIconMobile: {
    width: 42,
    height: 42,
    borderRadius: 14
  },
  previewIconText: { 
    color: colors.accent, 
    fontFamily: fonts.title 
  },
  previewApp: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium 
  },
  previewNow: { 
    color: colors.textSoft 
  },
  previewTitle: { 
    color: colors.text, 
    fontFamily: fonts.title, 
    marginTop: 4 
  },
  previewText: { 
    color: colors.textMuted, 
    fontFamily: fonts.regular, 
    lineHeight: 18, 
    marginTop: 4 
  },
  
  timeline: { 
    width: 220, 
    gap: spacing.sm 
  },
  timelineItem: { 
    color: colors.textMuted, 
    fontFamily: fonts.medium,
    fontSize: 13
  },
  timelineDone: { 
    color: colors.success, 
    fontFamily: fonts.bold 
  },
  
  healthCard: { 
    padding: spacing.lg 
  },
  healthCardMobile: {
    padding: spacing.md
  },

  ringtoneCard: {
    padding: spacing.lg
  },
  ringtoneCardMobile: {
    padding: spacing.md
  },
  ringtoneInfo: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  ringtoneLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium
  },
  ringtoneName: {
    color: colors.text,
    fontFamily: fonts.bold,
    marginTop: spacing.xs
  },
  ringtoneActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  ringtoneActionsMobile: {
    flexDirection: "column"
  },
  ringtoneActionButton: {
    flex: 1
  },
  
  metric: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: spacing.md, 
    borderRadius: radius.md, 
    borderWidth: 1, 
    borderColor: colors.border, 
    backgroundColor: colors.surfaceMuted, 
    padding: spacing.md, 
    marginBottom: spacing.sm 
  },
  metricMobile: {
    padding: spacing.sm,
    gap: spacing.sm
  },
  metricDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  metricLabel: { 
    color: colors.text, 
    fontFamily: fonts.bold 
  },
  metricValue: { 
    color: colors.textMuted, 
    fontFamily: fonts.regular, 
    marginTop: 2 
  },
  
  helpCard: { 
    padding: spacing.lg 
  },
  helpCardMobile: {
    padding: spacing.md
  },
  helpTitle: { 
    color: colors.text, 
    fontFamily: fonts.title 
  },
  helpText: { 
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.sm 
  },

  apiCard: {
    padding: spacing.lg
  },
  apiCardMobile: {
    padding: spacing.md
  },
  apiActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  apiActionsMobile: {
    flexDirection: "column"
  },
  apiActionButton: {
    flex: 1
  },

  creditsCard: {
    padding: spacing.lg
  },
  creditsCardMobile: {
    padding: spacing.md
  },
  creditsTitle: {
    color: colors.text,
    fontFamily: fonts.title
  },
  creditsText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginTop: spacing.sm
  }
});
