import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { PageHeader } from "../src/components/PageHeader";
import { ScreenLayout } from "../src/components/ScreenLayout";
import { Button, Card, EmptyState, LoadingState } from "../src/components/ui";
import { IconSymbol } from "../src/components/IconSymbol";
import { fonts, radius, spacing, scaledFont } from "../src/theme";
import { useThemeMode } from "../src/context/ThemeContext";
import { useResponsive } from "../src/hooks/useResponsive";
import {
  AppNotification,
  listAppNotificationsRequest,
  markAllNotificationsReadRequest,
  markNotificationReadRequest
} from "../src/services/appNotifications";

export default function NotificationsScreen() {
  const { theme } = useThemeMode();
  const { width } = useResponsive();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const result = await listAppNotificationsRequest();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  async function handleMarkAllRead() {
    await markAllNotificationsReadRequest();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }

  async function handlePress(notification: AppNotification) {
    if (!notification.readAt) {
      await markNotificationReadRequest(notification.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    const data = notification.data as { groupId?: string } | null;

    if (notification.type === "CHAT_MESSAGE" && data?.groupId) {
      router.push(`/collaboration/${data.groupId}` as any);
    } else if (notification.type === "GROUP_INVITE") {
      router.push("/collaboration" as any);
    }
  }

  function formatTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  function getIcon(type: AppNotification["type"]) {
    return type === "CHAT_MESSAGE" ? "message-text-outline" : "email-outline";
  }

  function getIconColor(type: AppNotification["type"]) {
    return type === "CHAT_MESSAGE" ? theme.primary : "#8B5CF6";
  }

  return (
    <ScreenLayout>
      {({ openMenu, isWide }) => (
        <View style={{ flex: 1 }}>
          <PageHeader
            title="Notificações"
            subtitle={unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia"}
            onMenu={isWide ? undefined : openMenu}
            right={
              unreadCount > 0 ? (
                <Button
                  title="Marcar todas"
                  variant="secondary"
                  size="sm"
                  onPress={handleMarkAllRead}
                />
              ) : undefined
            }
          />

          {isLoading ? (
            <LoadingState label="Carregando notificações..." />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    loadData(true);
                  }}
                />
              }
              contentContainerStyle={styles.content}
            >
              {notifications.length === 0 ? (
                <EmptyState
                  iconName="bell-outline"
                  title="Nenhuma notificação"
                  description="Quando alguém te enviar uma mensagem ou convidar para um grupo, você verá aqui."
                />
              ) : (
                notifications.map((notification) => {
                  const isUnread = !notification.readAt;

                  return (
                    <Pressable key={notification.id} onPress={() => handlePress(notification)}>
                      <Card style={[styles.card, isUnread && { borderLeftColor: theme.primary, borderLeftWidth: 3 }]}>
                        <View style={styles.row}>
                          <View style={[styles.iconShell, { backgroundColor: `${getIconColor(notification.type)}18` }]}>
                            <IconSymbol name={getIcon(notification.type)} size={20} color={getIconColor(notification.type)} />
                          </View>
                          <View style={styles.textArea}>
                            <View style={styles.titleRow}>
                              <Text
                                style={[
                                  styles.title,
                                  { color: theme.text, fontSize: scaledFont(14, width) },
                                  isUnread && { fontFamily: fonts.bold }
                                ]}
                                numberOfLines={1}
                              >
                                {notification.title}
                              </Text>
                              {isUnread && (
                                <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                              )}
                            </View>
                            <Text style={[styles.body, { color: theme.textMuted, fontSize: scaledFont(13, width) }]} numberOfLines={2}>
                              {notification.body}
                            </Text>
                            <Text style={[styles.time, { color: theme.textMuted, fontSize: scaledFont(11, width) }]}>
                              {formatTime(notification.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
    gap: spacing.sm
  },
  card: {
    marginBottom: 0
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  iconShell: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center"
  },
  textArea: {
    flex: 1,
    gap: 2
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    fontFamily: fonts.medium,
    flex: 1
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  body: {
    fontFamily: fonts.regular,
    lineHeight: 18
  },
  time: {
    fontFamily: fonts.regular,
    marginTop: 2
  }
});
