import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { PageHeader } from "../src/components/PageHeader";
import { IconSymbol } from "../src/components/IconSymbol";
import { Button } from "../src/components/ui";
import { scheduleReminderAlarm } from "../src/services/alarmNotifications";

type PermStatus = "ok" | "pending" | "denied" | "checking";

type DiagItem = {
  id: string;
  label: string;
  description: string;
  status: PermStatus;
  fixLabel?: string;
  onFix?: () => void;
};

export default function PermissionDiagnosticsScreen() {
  const { theme } = useThemeMode();
  const { width } = useResponsive();

  const [notifStatus, setNotifStatus] = useState<PermStatus>("checking");
  const [soundStatus, setSoundStatus] = useState<PermStatus>("checking");
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);

  const checkPermissions = useCallback(async () => {
    try {
      const perms = await Notifications.getPermissionsAsync();
      if (perms.granted || perms.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        setNotifStatus("ok");
        setSoundStatus("ok");
      } else if (perms.canAskAgain) {
        setNotifStatus("pending");
        setSoundStatus("pending");
      } else {
        setNotifStatus("denied");
        setSoundStatus("denied");
      }
    } catch {
      setNotifStatus("pending");
      setSoundStatus("pending");
    }
  }, []);

  useFocusEffect(useCallback(() => { checkPermissions(); }, [checkPermissions]));

  async function requestNotification() {
    const result = await Notifications.requestPermissionsAsync();
    if (result.granted) {
      setNotifStatus("ok");
      setSoundStatus("ok");
    } else {
      setNotifStatus("denied");
      Alert.alert(
        "Permissão negada",
        "Abra as configurações do dispositivo para habilitar as notificações do app.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir configurações", onPress: () => Linking.openSettings() }
        ]
      );
    }
  }

  async function testAlarm() {
    try {
      setIsTestingAlarm(true);
      const in10s = new Date(Date.now() + 10 * 1000).toISOString();
      await scheduleReminderAlarm({
        reminderId: "test-alarm",
        title: "Teste de alarme",
        description: "Se você está vendo isso, os alarmes estão funcionando!",
        startAt: in10s,
        alarmLevel: "IMPORTANTE"
      });
      Alert.alert("Alarme de teste", "Um alarme de teste foi agendado para daqui a 10 segundos.");
    } catch (e: any) {
      Alert.alert("Erro no teste", e?.message || "Não foi possível agendar o alarme de teste.");
    } finally {
      setIsTestingAlarm(false);
    }
  }

  function StatusIcon({ status }: { status: PermStatus }) {
    if (status === "checking") return <IconSymbol name="clock-outline" size={20} color={colors.warning} />;
    if (status === "ok") return <IconSymbol name="check-circle-outline" size={20} color={colors.success} />;
    if (status === "pending") return <IconSymbol name="alert-circle-outline" size={20} color={colors.warning} />;
    return <IconSymbol name="close-circle-outline" size={20} color={colors.danger} />;
  }

  function statusColor(s: PermStatus) {
    if (s === "ok") return colors.success;
    if (s === "pending") return colors.warning;
    if (s === "denied") return colors.danger;
    return colors.warning;
  }

  function statusLabel(s: PermStatus) {
    if (s === "ok") return "Ativo";
    if (s === "pending") return "Pendente";
    if (s === "denied") return "Negado";
    return "Verificando...";
  }

  const items: DiagItem[] = [
    {
      id: "notifications",
      label: "Notificações",
      description: "Permissão para exibir alertas e notificações do app.",
      status: notifStatus,
      fixLabel: notifStatus === "denied" ? "Abrir configurações" : "Ativar agora",
      onFix: notifStatus === "denied"
        ? () => Linking.openSettings()
        : requestNotification
    },
    {
      id: "sound",
      label: "Som do alarme",
      description: "Arquivo de som personalizado para alertas importantes.",
      status: soundStatus
    },
    {
      id: "platform",
      label: Platform.OS === "android" ? "Canal Android" : "Notificações iOS",
      description: Platform.OS === "android"
        ? "Canais de notificação configurados para diferentes níveis de alarme."
        : "Alertas, sons e badges configurados para lembretes.",
      status: notifStatus === "ok" ? "ok" : "pending"
    }
  ];

  const allOk = items.every((i) => i.status === "ok");

  return (
    <ScreenLayout scroll={true}>
      {({ openMenu, isWide }) => (
        <View style={styles.page}>
          <PageHeader
            title="Diagnóstico"
            subtitle="Status de permissões e alarmes"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Pressable
                style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.back()}
              >
                <IconSymbol name="arrow-left" size={16} color={theme.text} />
              </Pressable>
            }
          />

          {/* Status geral */}
          <View style={[
            styles.statusBanner,
            { backgroundColor: allOk ? colors.successSoft : colors.warningSoft, borderColor: allOk ? "#BBF7D0" : "#FED7AA" }
          ]}>
            <IconSymbol
              name={allOk ? "check-decagram-outline" : "alert-circle-outline"}
              size={24}
              color={allOk ? colors.success : colors.warning}
            />
            <View style={styles.bannerBody}>
              <Text style={[styles.bannerTitle, { color: allOk ? colors.success : colors.warning, fontSize: scaledFont(15, width) }]}>
                {allOk ? "Tudo configurado!" : "Algumas permissões precisam de atenção"}
              </Text>
              <Text style={[styles.bannerText, { color: allOk ? "#065F46" : "#92400E", fontSize: scaledFont(12, width) }]}>
                {allOk
                  ? "Os alarmes estão prontos para funcionar corretamente."
                  : "Configure as permissões abaixo para garantir que os alarmes funcionem."}
              </Text>
            </View>
          </View>

          {/* Itens de diagnóstico */}
          <Text style={[styles.sectionLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>
            Status das permissões
          </Text>

          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.diagCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.diagHeader}>
                <View style={styles.diagLeft}>
                  <StatusIcon status={item.status} />
                  <View>
                    <Text style={[styles.diagLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.diagStatus, { color: statusColor(item.status), fontSize: scaledFont(11, width) }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                {item.status !== "ok" && item.onFix && (
                  <Pressable
                    style={[styles.fixBtn, { backgroundColor: theme.primarySoft }]}
                    onPress={item.onFix}
                  >
                    <Text style={[styles.fixBtnText, { color: theme.primary, fontSize: scaledFont(12, width) }]}>
                      {item.fixLabel || "Corrigir"}
                    </Text>
                  </Pressable>
                )}
              </View>
              <Text style={[styles.diagDesc, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                {item.description}
              </Text>
            </View>
          ))}

          {/* Níveis de alarme */}
          <Text style={[styles.sectionLabel, { color: theme.text, fontSize: scaledFont(14, width), marginTop: spacing.lg }]}>
            Níveis de alarme configurados
          </Text>

          {[
            { level: "LEVE", label: "Leve", desc: "Notificação simples, sem som persistente.", color: colors.success, icon: "bell-outline" },
            { level: "IMPORTANTE", label: "Importante", desc: "Notificação + som + vibração. Padrão.", color: colors.primary, icon: "bell-ring-outline" },
            { level: "CRITICO", label: "Crítico", desc: "Persistente + bypassa modo silencioso + confirmação.", color: colors.danger, icon: "bell-alert-outline" },
            { level: "ROTINA", label: "Rotina", desc: "Lembrete suave e recorrente sem interrupção.", color: "#06B6D4", icon: "water-outline" }
          ].map((item) => (
            <View
              key={item.level}
              style={[styles.levelCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.levelIcon, { backgroundColor: `${item.color}18` }]}>
                <IconSymbol name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={styles.levelBody}>
                <Text style={[styles.levelLabel, { color: theme.text, fontSize: scaledFont(13, width) }]}>
                  {item.label}
                </Text>
                <Text style={[styles.levelDesc, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                  {item.desc}
                </Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: `${item.color}18` }]}>
                <Text style={[styles.levelBadgeText, { color: item.color, fontSize: scaledFont(10, width) }]}>
                  Ativo
                </Text>
              </View>
            </View>
          ))}

          {/* Botão de teste */}
          <View style={styles.testSection}>
            <Text style={[styles.sectionLabel, { color: theme.text, fontSize: scaledFont(14, width) }]}>
              Testar alarme
            </Text>
            <Button
              title={isTestingAlarm ? "Agendando..." : "Enviar alarme de teste (10s)"}
              icon="bell-ring-outline"
              onPress={testAlarm}
              loading={isTestingAlarm}
              disabled={notifStatus !== "ok"}
              fullWidth
            />
            {notifStatus !== "ok" && (
              <Text style={[styles.testHint, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                Ative as notificações acima para testar.
              </Text>
            )}
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%" },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.soft
  },
  bannerBody: { flex: 1 },
  bannerTitle: { fontFamily: fonts.bold },
  bannerText: { fontFamily: fonts.regular, marginTop: 2, lineHeight: 18 },

  sectionLabel: {
    fontFamily: fonts.bold,
    marginBottom: spacing.md
  },

  diagCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft
  },
  diagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs
  },
  diagLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1
  },
  diagLabel: { fontFamily: fonts.bold },
  diagStatus: { fontFamily: fonts.medium, marginTop: 1 },
  diagDesc: { fontFamily: fonts.regular, lineHeight: 18, marginLeft: spacing.xxl + spacing.xs },
  fixBtn: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  fixBtnText: { fontFamily: fonts.bold },

  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  levelBody: { flex: 1 },
  levelLabel: { fontFamily: fonts.bold },
  levelDesc: { fontFamily: fonts.regular, marginTop: 2 },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  levelBadgeText: { fontFamily: fonts.bold },

  testSection: { marginTop: spacing.lg },
  testHint: { fontFamily: fonts.medium, marginTop: spacing.sm, textAlign: "center" }
});
