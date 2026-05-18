import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
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
import {
  getWeeklyReportEnabled,
  setWeeklyReportEnabled,
  getWeeklyReportHour,
  setWeeklyReportHour,
  scheduleWeeklyReport,
  cancelWeeklyReport
} from "../src/services/weeklyReport";
import {
  getNotificationPreferencesRequest,
  updateNotificationPreferencesRequest
} from "../src/services/notificationPreferences";
import { uploadAvatarRequest } from "../src/services/auth";
import { DashboardMetrics } from "../src/types/api";
import { useThemeMode } from "../src/context/ThemeContext";
import { IconSymbol } from "../src/components/IconSymbol";
import { useAuth } from "../src/context/AuthContext";

export default function SettingsScreen() {
  const { width, isPhone, isSmallPhone, isPhoneLarge, gap } = useResponsive();
  const { mode, setMode, theme, isDark } = useThemeMode();
  const { user, updateProfile } = useAuth();
  const isMobile = isPhone || isSmallPhone || isPhoneLarge;
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatarUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreviewFailed, setAvatarPreviewFailed] = useState(false);
  const [apiUrl, setApiUrl] = useState(getDefaultApiBaseUrl());
  const [isSavingApiUrl, setIsSavingApiUrl] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardMetrics["summary"] | null>(null);
  const [customRingtone, setCustomRingtone] = useState<CustomRingtone | null>(null);
  const [isPickingRingtone, setIsPickingRingtone] = useState(false);
  const [isPreviewingRingtone, setIsPreviewingRingtone] = useState(false);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [weeklyHour, setWeeklyHour] = useState(9);
  const [isTestingWeekly, setIsTestingWeekly] = useState(false);
  const [chatNotificationsEnabled, setChatNotificationsEnabled] = useState(true);

  useEffect(() => {
    getApiBaseUrl().then(setApiUrl);
    getCustomRingtone().then(setCustomRingtone);
    getWeeklyReportEnabled().then(setWeeklyEnabled);
    getWeeklyReportHour().then(setWeeklyHour);
    getNotificationPreferencesRequest()
      .then((pref) => setChatNotificationsEnabled(pref.chatNotificationsEnabled))
      .catch(() => {});
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

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfileAvatarUrl(user?.avatarUrl || "");
    setAvatarPreviewFailed(false);
  }, [user?.id, user?.name, user?.email, user?.avatarUrl]);

  async function handleSaveProfile() {
    const name = profileName.trim();
    const email = profileEmail.trim().toLowerCase();
    const avatarUrl = profileAvatarUrl.trim();

    if (name.length < 2) {
      Alert.alert("Nome invalido", "Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("E-mail invalido", "Informe um e-mail valido.");
      return;
    }

    if (avatarUrl && !avatarUrl.startsWith("https://")) {
      Alert.alert("URL invalida", "Use uma URL HTTPS para a foto do perfil.");
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({
        name,
        email,
        avatarUrl: avatarUrl || null
      });
      setAvatarPreviewFailed(false);
      Alert.alert("Perfil salvo", "Seus dados foram atualizados.");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel atualizar o perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleClearAvatar() {
    setProfileAvatarUrl("");
    setAvatarPreviewFailed(false);
  }

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissao necessaria", "Permita o acesso a galeria para escolher uma foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      setIsUploadingAvatar(true);
      const avatarUrl = await uploadAvatarRequest(result.assets[0].uri);
      setProfileAvatarUrl(avatarUrl);
      setAvatarPreviewFailed(false);
      await updateProfile({ name: profileName.trim(), email: profileEmail.trim().toLowerCase(), avatarUrl });
      Alert.alert("Foto atualizada", "Sua foto de perfil foi salva com sucesso.");
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel enviar a foto.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

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

  async function handleToggleWeeklyReport(value: boolean) {
    setWeeklyEnabled(value);
    await setWeeklyReportEnabled(value);
    if (!value) {
      await cancelWeeklyReport();
    } else {
      const metrics = await getDashboardMetricsRequest().catch(() => null);
      await scheduleWeeklyReport(metrics);
    }
  }

  async function handleWeeklyHourChange(delta: number) {
    const next = Math.max(0, Math.min(23, weeklyHour + delta));
    setWeeklyHour(next);
    await setWeeklyReportHour(next);
    if (weeklyEnabled) {
      const metrics = await getDashboardMetricsRequest().catch(() => null);
      await scheduleWeeklyReport(metrics);
    }
  }

  async function handleTestWeeklyReport() {
    try {
      setIsTestingWeekly(true);
      const metrics = await getDashboardMetricsRequest().catch(() => null);
      await scheduleWeeklyReport(metrics);
      Alert.alert("Relatorio semanal", "Notificacao agendada para todo domingo.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Nao foi possivel agendar o relatorio.");
    } finally {
      setIsTestingWeekly(false);
    }
  }

  async function handleToggleChatNotifications(value: boolean) {
    setChatNotificationsEnabled(value);
    try {
      await updateNotificationPreferencesRequest({ chatNotificationsEnabled: value });
    } catch {
      setChatNotificationsEnabled(!value);
      Alert.alert("Erro", "Nao foi possivel salvar a preferencia.");
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

  const avatarPreviewUrl = profileAvatarUrl.trim();
  const profileInitial = (profileName || user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View>
          <PageHeader
            title="Configuracoes"
            subtitle="Personalize notificacoes, aparencia e conexao do app"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[
                  styles.backButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSmallPhone && styles.backButtonSmall
                ]}
                onPress={() => router.back()}
              >
                <IconSymbol name="arrow-left" size={16} color={theme.text} />
                <Text style={[styles.backText, { color: theme.text, fontSize: scaledFont(13, width) }]}>Voltar</Text>
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
                  <View style={[styles.statusBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobile && styles.statusBoxMobile]}>
                    <Text style={[styles.statusLabel, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Status do servico</Text>
                    <Text style={[styles.statusGood, { fontSize: scaledFont(isMobile ? 18 : 20, width) }]}>Operacional</Text>
                    <Text style={[styles.statusSub, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>Todos os sistemas ok</Text>
                  </View>
                  <View style={[styles.statusBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobile && styles.statusBoxMobile]}>
                    <Text style={[styles.statusLabel, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Permissao atual</Text>
                    <Text style={[styles.statusWarn, { fontSize: scaledFont(isMobile ? 18 : 20, width) }]}>Verificar</Text>
                    <Text style={[styles.statusSub, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>Necessaria para alarmes</Text>
                  </View>
                </View>
                <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile, { gap: spacing.sm }]}>
                  <Button
                    title="Liberar permissao"
                    variant="secondary"
                    onPress={requestAlarmNotificationPermission as any}
                    style={[styles.actionButton, isMobile && styles.actionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title={isMobile ? "Testar alarme" : "Enviar teste em 10s"}
                    variant="ai"
                    onPress={handleTestAlarm}
                    style={[styles.actionButton, isMobile && styles.actionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
                <View style={[styles.infoStrip, { backgroundColor: theme.primarySoft }, isMobile && styles.infoStripMobile]}>
                  <Text style={[styles.infoStripText, { color: theme.primaryDark, fontSize: scaledFont(12, width) }]}>
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
                  <View style={[styles.notificationPreview, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobile && styles.notificationPreviewMobile]}>
                    <View style={[styles.previewIcon, { backgroundColor: theme.accentSoft }, isMobile && styles.previewIconMobile]}>
                      <Text style={[styles.previewIconText, { fontSize: scaledFont(isMobile ? 14 : 16, width) }]}>AI</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.previewApp, { fontSize: scaledFont(12, width) }]}>
                        Rotina AI <Text style={[styles.previewNow, { color: theme.textSoft }]}>agora</Text>
                      </Text>
                      <Text style={[styles.previewTitle, { color: theme.text, fontSize: scaledFont(14, width) }]}>
                        Este e um alarme de teste
                      </Text>
                      <Text style={[styles.previewText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                        Se voce esta vendo esta mensagem, suas notificacoes estao funcionando.
                      </Text>
                    </View>
                  </View>
                  {!isMobile && (
                    <View style={styles.timeline}>
                      <Text style={[styles.timelineItem, { color: theme.textMuted }]}>00s  Enviando notificacao...</Text>
                      <Text style={[styles.timelineItem, { color: theme.textMuted }]}>02s  Entregando ao dispositivo...</Text>
                      <Text style={[styles.timelineItem, { color: theme.textMuted }]}>04s  Exibindo notificacao</Text>
                      <Text style={[styles.timelineItem, styles.timelineDone]}>10s  Concluido!</Text>
                    </View>
                  )}
                </View>
              </Card>
            </View>

            {/* Right Column */}
            <View style={[styles.rightColumn, isMobile && styles.columnMobile, { gap }]}>
              <Card style={[styles.profileCard, isMobile && styles.profileCardMobile]}>
                <SectionTitle
                  title="Perfil"
                  subtitle="Atualize seus dados e a foto que aparece no app."
                />
                <View style={[styles.profileHeader, isMobile && styles.profileHeaderMobile]}>
                  <Pressable
                    onPress={handlePickImage}
                    disabled={isUploadingAvatar}
                    style={[styles.profileAvatar, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
                  >
                    {avatarPreviewUrl && !avatarPreviewFailed ? (
                      <Image
                        source={{ uri: avatarPreviewUrl }}
                        style={styles.profileAvatarImage}
                        onError={() => setAvatarPreviewFailed(true)}
                      />
                    ) : (
                      <Text style={[styles.profileAvatarText, { color: theme.primary, fontSize: scaledFont(26, width) }]}>
                        {profileInitial}
                      </Text>
                    )}
                    <View style={[styles.avatarCameraOverlay, { backgroundColor: theme.primary }]}>
                      {isUploadingAvatar
                        ? <ActivityIndicator size={12} color="#fff" />
                        : <IconSymbol name="camera-outline" size={12} color="#fff" />
                      }
                    </View>
                  </Pressable>
                  <View style={styles.profileSummary}>
                    <Text style={[styles.profileName, { color: theme.text, fontSize: scaledFont(16, width) }]} numberOfLines={1}>
                      {profileName || "Usuario"}
                    </Text>
                    <Text style={[styles.profileEmail, { color: theme.textMuted, fontSize: scaledFont(12, width) }]} numberOfLines={1}>
                      {profileEmail || "email@exemplo.com"}
                    </Text>
                  </View>
                </View>
                <Input
                  label="Nome"
                  value={profileName}
                  onChangeText={setProfileName}
                  autoCapitalize="words"
                  size={isMobile ? "sm" : "md"}
                />
                <Input
                  label="E-mail"
                  value={profileEmail}
                  onChangeText={setProfileEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  size={isMobile ? "sm" : "md"}
                />
                <View style={[styles.profileActions, isMobile && styles.profileActionsMobile, { gap: spacing.sm }]}>
                  <Button
                    title="Salvar perfil"
                    variant="ai"
                    onPress={handleSaveProfile}
                    loading={isSavingProfile}
                    disabled={isUploadingAvatar}
                    style={[styles.profileActionButton, isMobile && styles.profileActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title="Remover foto"
                    variant="secondary"
                    onPress={handleClearAvatar}
                    disabled={isSavingProfile || isUploadingAvatar || !profileAvatarUrl}
                    style={[styles.profileActionButton, isMobile && styles.profileActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
              </Card>

              <Card style={[styles.themeCard, isMobile && styles.themeCardMobile]}>
                <SectionTitle
                  title="Aparencia"
                  subtitle="Escolha como o Rotina AI deve aparecer em todo o app."
                />
                <View style={styles.themeOptions}>
                  {[
                    { key: "light", label: "Claro", icon: "white-balance-sunny" },
                    { key: "dark", label: "Escuro", icon: "weather-night" }
                  ].map((item) => {
                    const active = mode === item.key;

                    return (
                      <Pressable
                        key={item.key}
                        style={[
                          styles.themeOption,
                          {
                            backgroundColor: active ? theme.primarySoft : theme.surfaceMuted,
                            borderColor: active ? theme.primary : theme.border
                          }
                        ]}
                        onPress={() => setMode(item.key as "light" | "dark")}
                      >
                        <IconSymbol
                          name={item.icon}
                          size={isMobile ? 18 : 20}
                          color={active ? theme.primary : theme.textMuted}
                        />
                        <Text
                          style={[
                            styles.themeOptionText,
                            { color: active ? theme.primary : theme.text, fontSize: scaledFont(13, width) }
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.themeHint, { color: theme.textMuted }]}>
                  Tema atual: {isDark ? "modo escuro" : "modo claro"}.
                </Text>
              </Card>

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
                <View style={[styles.ringtoneInfo, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                  <Text style={[styles.ringtoneLabel, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Arquivo atual</Text>
                  <Text style={[styles.ringtoneName, { color: theme.text, fontSize: scaledFont(14, width) }]} numberOfLines={2}>
                    {customRingtone?.name || "Som padrao"}
                  </Text>
                </View>
                <View style={[styles.ringtoneActions, isMobile && styles.ringtoneActionsMobile, { gap: spacing.sm }]}>
                  <Button
                    title={customRingtone ? "Trocar audio" : "Escolher audio"}
                    variant="ai"
                    onPress={handlePickRingtone}
                    loading={isPickingRingtone}
                    style={[styles.ringtoneActionButton, isMobile && styles.ringtoneActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title={isPreviewingRingtone ? "Parar preview" : "Ouvir toque"}
                    variant="secondary"
                    onPress={handleTogglePreviewRingtone}
                    disabled={!customRingtone || isPickingRingtone}
                    style={[styles.ringtoneActionButton, isMobile && styles.ringtoneActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title="Remover toque"
                    variant="danger"
                    onPress={handleClearRingtone}
                    disabled={!customRingtone || isPickingRingtone}
                    style={[styles.ringtoneActionButton, isMobile && styles.ringtoneActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
              </Card>

              {/* Help Card */}
              <Card style={[styles.helpCard, isMobile && styles.helpCardMobile]}>
                <Text style={[styles.helpTitle, { color: theme.text, fontSize: scaledFont(isMobile ? 16 : 18, width) }]}>
                  Precisa de ajuda?
                </Text>
                <Text style={[styles.helpText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
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

              {/* Weekly Report Card */}
              <Card style={[styles.weeklyCard, isMobile && styles.weeklyCardMobile]}>
                <SectionTitle
                  title="Relatorio semanal"
                  subtitle="Receba todo domingo um resumo da sua semana via notificacao."
                />
                <View style={[styles.weeklyRow, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.weeklyRowLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>Ativar relatorio semanal</Text>
                    <Text style={[styles.weeklyRowSub, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Domingo de manha com resumo da semana</Text>
                  </View>
                  <Switch
                    value={weeklyEnabled}
                    onValueChange={handleToggleWeeklyReport}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={weeklyEnabled ? "#fff" : theme.textMuted}
                  />
                </View>
                <View style={[styles.weeklyRow, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.weeklyRowLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>Horario do envio</Text>
                    <Text style={[styles.weeklyRowSub, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>Todo domingo as {String(weeklyHour).padStart(2, "0")}:00h</Text>
                  </View>
                  <View style={styles.weeklyHourControls}>
                    <Pressable
                      style={[styles.weeklyHourBtn, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                      onPress={() => handleWeeklyHourChange(-1)}
                      disabled={!weeklyEnabled}
                    >
                      <Text style={[{ color: weeklyEnabled ? theme.text : theme.textMuted, fontSize: scaledFont(16, width) }]}>-</Text>
                    </Pressable>
                    <Text style={[styles.weeklyHourValue, { color: theme.text, fontSize: scaledFont(16, width) }]}>
                      {String(weeklyHour).padStart(2, "0")}h
                    </Text>
                    <Pressable
                      style={[styles.weeklyHourBtn, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                      onPress={() => handleWeeklyHourChange(1)}
                      disabled={!weeklyEnabled}
                    >
                      <Text style={[{ color: weeklyEnabled ? theme.text : theme.textMuted, fontSize: scaledFont(16, width) }]}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <Button
                  title="Reagendar agora"
                  variant="secondary"
                  onPress={handleTestWeeklyReport}
                  loading={isTestingWeekly}
                  disabled={!weeklyEnabled}
                  style={{ marginTop: spacing.md }}
                  size={isMobile ? "md" : "lg"}
                  fullWidth
                />
              </Card>

              {/* Chat Notifications Card */}
              <Card style={[styles.weeklyCard, isMobile && styles.weeklyCardMobile]}>
                <SectionTitle
                  title="Notificacoes do grupo"
                  subtitle="Receba alertas quando alguem enviar mensagem no chat do grupo, igual ao WhatsApp."
                />
                <View style={[styles.weeklyRow, { borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.weeklyRowLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>Ativar notificacoes do chat</Text>
                    <Text style={[styles.weeklyRowSub, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                      {chatNotificationsEnabled ? "Voce sera avisado de novas mensagens" : "Notificacoes de chat desativadas"}
                    </Text>
                  </View>
                  <Switch
                    value={chatNotificationsEnabled}
                    onValueChange={handleToggleChatNotifications}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={chatNotificationsEnabled ? "#fff" : theme.textMuted}
                  />
                </View>
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
                <View style={[styles.apiActions, isMobile && styles.apiActionsMobile, { gap: spacing.sm }]}>
                  <Button
                    title="Salvar URL"
                    variant="ai"
                    onPress={handleSaveApiUrl}
                    loading={isSavingApiUrl}
                    style={[styles.apiActionButton, isMobile && styles.apiActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                  <Button
                    title="Usar padrao"
                    variant="secondary"
                    onPress={handleResetApiUrl}
                    disabled={isSavingApiUrl}
                    style={[styles.apiActionButton, isMobile && styles.apiActionButtonMobile]}
                    size={isMobile ? "md" : "lg"}
                  />
                </View>
              </Card>

              {/* Credits Card */}
              <Card style={[styles.creditsCard, isMobile && styles.creditsCardMobile]}>
                <Text style={[styles.creditsTitle, { color: theme.text, fontSize: scaledFont(isMobile ? 16 : 18, width) }]}>
                  Sobre o App
                </Text>
                <Text style={[styles.creditsText, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
                  Rotina AI - Gerenciador de Rotinas Inteligente
                </Text>
                <Text style={[styles.creditsText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                  Criador: William Oliveira Dos Santos
                </Text>
                <Text style={[styles.creditsText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                  Contato: william100william@gmail.com
                </Text>
                <Text style={[styles.creditsText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                  Conta Expo: williamdevbackend
                </Text>
                <Text style={[styles.creditsText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                  Versao 3.2.2
                </Text>
                <Button
                  title="Privacidade e termos"
                  icon="shield-lock-outline"
                  variant="secondary"
                  onPress={() => router.push("/privacy")}
                  style={{ marginTop: spacing.md }}
                />
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
  const { theme } = useThemeMode();
  const color = tone === "green" ? theme.success : tone === "orange" ? theme.warning : theme.primary;
  return (
    <View style={[styles.metric, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }, isMobile && styles.metricMobile]}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.metricLabel, { color: theme.text, fontSize: scaledFont(13, width) }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: theme.textMuted, fontSize: scaledFont(12, width) }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
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
  profileCard: {
    padding: spacing.lg
  },
  profileCardMobile: {
    padding: spacing.md
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  profileHeaderMobile: {
    alignItems: "flex-start"
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center"
  },
  profileAvatarImage: {
    width: "100%",
    height: "100%"
  },
  profileAvatarText: {
    fontFamily: fonts.title
  },
  avatarCameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  profileSummary: {
    flex: 1,
    minWidth: 0
  },
  profileName: {
    fontFamily: fonts.title
  },
  profileEmail: {
    fontFamily: fonts.regular,
    marginTop: 2
  },
  profileActions: {
    flexDirection: "row"
  },
  profileActionsMobile: {
    flexDirection: "column"
  },
  profileActionButton: {
    flex: 1
  },
  profileActionButtonMobile: {
    width: "100%",
    flex: 0
  },
  themeCard: {
    padding: spacing.lg
  },
  themeCardMobile: {
    padding: spacing.md
  },
  themeOptions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  themeOption: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  themeOptionText: {
    fontFamily: fonts.bold,
    fontSize: 14
  },
  themeHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md
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
    flexDirection: "row",
    gap: spacing.sm
  },
  actionsRowMobile: {
    flexDirection: "column"
  },
  actionButton: {
    flex: 1
  },
  actionButtonMobile: {
    width: "100%",
    flex: 0
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
  ringtoneActionButtonMobile: {
    width: "100%",
    flex: 0
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

  weeklyCard: {
    padding: spacing.lg
  },
  weeklyCardMobile: {
    padding: spacing.md
  },
  weeklyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  weeklyRowLabel: {
    fontFamily: fonts.bold
  },
  weeklyRowSub: {
    fontFamily: fonts.regular,
    marginTop: 2
  },
  weeklyHourControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  weeklyHourBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  weeklyHourValue: {
    fontFamily: fonts.bold,
    minWidth: 40,
    textAlign: "center"
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
  apiActionButtonMobile: {
    width: "100%",
    flex: 0
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
