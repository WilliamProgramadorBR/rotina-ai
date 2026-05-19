import { memo, useCallback, useMemo, useRef, useState } from "react";
import type { ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { IconSymbol } from "../IconSymbol";
import { CollaborationGroup, CollaborationMessage, CollaborationPresence } from "../../types/entities";
import {
  listCollaborationMessagesRequest,
  sendCollaborationMessageRequest
} from "../../services/collaboration";
import { fonts, radius, spacing } from "../../theme";
import { useResponsive } from "../../hooks/useResponsive";
import { useThemeMode } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { CollaborationUserAvatar } from "./CollaborationUserAvatar";

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatLastSeen(value?: string | null) {
  if (!value) {
    return "sem sinal";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) {
    return "sem sinal";
  }

  if (diffMs < 60_000) {
    return "agora";
  }

  if (diffMs < 3_600_000) {
    return `ha ${Math.max(1, Math.round(diffMs / 60_000))} min`;
  }

  return formatMessageTime(value);
}

function getSenderName(message: CollaborationMessage, currentUserId?: string | null) {
  const isMine = Boolean(message.isMine || message.userId === currentUserId);
  return isMine ? "Voce" : message.user?.name || "Membro";
}

function areMessagesEqual(current: CollaborationMessage[], next: CollaborationMessage[]) {
  if (current.length !== next.length) return false;

  return current.every((message, index) => {
    const nextMessage = next[index];

    return (
      message.id === nextMessage.id &&
      message.updatedAt === nextMessage.updatedAt &&
      message.message === nextMessage.message &&
      message.isMine === nextMessage.isMine &&
      message.user?.name === nextMessage.user?.name &&
      message.user?.avatarUrl === nextMessage.user?.avatarUrl
    );
  });
}

function arePresenceEqual(current: CollaborationPresence[], next: CollaborationPresence[]) {
  if (current.length !== next.length) return false;

  return current.every((item, index) => {
    const nextItem = next[index];

    return (
      item.userId === nextItem.userId &&
      item.status === nextItem.status &&
      item.lastSeenAt === nextItem.lastSeenAt &&
      item.user?.name === nextItem.user?.name &&
      item.user?.avatarUrl === nextItem.user?.avatarUrl
    );
  });
}

type CollaborationChatRoomProps = {
  groupId: string;
  group: CollaborationGroup;
};

export function CollaborationChatRoom({ groupId, group }: CollaborationChatRoomProps) {
  const { width, isPhone, isSmallPhone } = useResponsive();
  const { theme } = useThemeMode();
  const { user } = useAuth();
  const chatListRef = useRef<FlatList<CollaborationMessage> | null>(null);
  const stickToBottomRef = useRef(true);
  const roomRequestInFlightRef = useRef(false);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [presence, setPresence] = useState<CollaborationPresence[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const isMobile = isPhone || isSmallPhone;

  const presenceItems = useMemo(() => (
    presence.length > 0
      ? presence
      : (group.members || []).map((member) => ({
        id: member.id,
        groupId,
        userId: member.userId,
        lastSeenAt: null,
        status: "OFFLINE" as const,
        user: member.user,
        isCurrentUser: member.userId === user?.id
      }))
  ), [group.members, groupId, presence, user?.id]);

  const activityPrompts = useMemo(() => {
    const schedules = group.schedules || [];
    const firstSchedule = schedules[0];
    const pendingReminders = schedules
      .flatMap((schedule) => schedule.reminders || [])
      .filter((reminder) => reminder.status !== "FINISHED");

    return [
      {
        id: "next",
        label: "Proximo passo",
        icon: "ray-start-arrow",
        text: "Qual e o proximo passo do grupo?"
      },
      {
        id: "help",
        label: "Pedir ajuda",
        icon: "hand-heart-outline",
        text: firstSchedule
          ? `Preciso de ajuda com ${firstSchedule.title}.`
          : "Preciso de ajuda com uma tarefa do grupo."
      },
      {
        id: "status",
        label: "Status",
        icon: "clipboard-check-outline",
        text: pendingReminders.length > 0
          ? `Temos ${pendingReminders.length} tarefa(s) pendente(s). Como dividimos?`
          : "Todas as tarefas parecem em dia. Alguem tem algum ajuste?"
      },
      {
        id: "done",
        label: "Atualizacao",
        icon: "check-circle-outline",
        text: firstSchedule
          ? `Atualizei a rotina ${firstSchedule.title}.`
          : "Atualizei uma parte da rotina do grupo."
      }
    ];
  }, [group.schedules]);

  const loadRoom = useCallback(async (silent = false) => {
    if (!groupId) return;
    if (roomRequestInFlightRef.current) return;

    try {
      roomRequestInFlightRef.current = true;
      if (!silent) setIsChatLoading(true);
      const room = await listCollaborationMessagesRequest(groupId, { limit: 100 });
      setMessages((current) => (
        areMessagesEqual(current, room.messages) ? current : room.messages
      ));
      setPresence((current) => (
        arePresenceEqual(current, room.presence) ? current : room.presence
      ));
      setOnlineCount(room.onlineCount);
    } finally {
      roomRequestInFlightRef.current = false;
      setIsChatLoading(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => {
    loadRoom();

    const interval = setInterval(() => {
      loadRoom(true).catch(() => {});
    }, 8_000);

    return () => clearInterval(interval);
  }, [loadRoom]));

  const keyExtractor = useCallback((item: CollaborationMessage) => item.id, []);

  const handleChatScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    stickToBottomRef.current = distanceFromBottom < 96;
  }, []);

  const scrollChatToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      chatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const renderMessage = useCallback(({ item }: ListRenderItemInfo<CollaborationMessage>) => (
    <ChatMessageItem
      message={item}
      senderName={getSenderName(item, user?.id)}
      isMine={Boolean(item.isMine || item.userId === user?.id)}
      isMobile={isMobile}
    />
  ), [isMobile, user?.id]);

  function handleUsePrompt(text: string) {
    setMessageText((current) => {
      const trimmed = current.trim();
      return trimmed ? `${trimmed}\n${text}` : text;
    });
  }

  async function handleSendMessage() {
    const text = messageText.trim();

    if (!text || isSendingMessage) {
      return;
    }

    try {
      setIsSendingMessage(true);
      const room = await sendCollaborationMessageRequest(groupId, {
        message: text
      });

      setMessageText("");
      setMessages((current) => [
        ...current.filter((message) => message.id !== room.message.id),
        room.message
      ].slice(-100));
      setPresence((current) => (
        arePresenceEqual(current, room.presence) ? current : room.presence
      ));
      setOnlineCount(room.onlineCount);

      stickToBottomRef.current = true;
      scrollChatToEnd(true);
    } finally {
      setIsSendingMessage(false);
    }
  }

  return (
    <View style={[styles.room, { backgroundColor: theme.surface }]}>
      <View style={[styles.roomTop, { borderColor: theme.border }]}>
        <View style={styles.roomTitleRow}>
          <View style={[styles.roomIcon, { backgroundColor: theme.primarySoft }]}>
            <IconSymbol name="message-text-outline" size={20} color={theme.primary} />
          </View>
          <View style={styles.roomTitleBox}>
            <Text style={[styles.roomTitle, { color: theme.text }]} numberOfLines={1}>
              Chat da equipe
            </Text>
            <Text style={[styles.roomSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {onlineCount} online agora
            </Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: theme.successSoft }]}>
            <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.liveText, { color: theme.success }]}>ao vivo</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presenceStrip}
        >
          {presenceItems.map((item) => {
            const isOnline = item.status === "ONLINE";

            return (
              <View key={item.userId} style={[styles.presencePill, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                <CollaborationUserAvatar
                  user={item.user}
                  size={36}
                  backgroundColor={isOnline ? theme.successSoft : theme.surface}
                  borderColor={isOnline ? theme.success : theme.border}
                  textColor={isOnline ? theme.success : theme.textMuted}
                  statusColor={isOnline ? theme.success : theme.textSoft}
                  statusBorderColor={theme.surfaceMuted}
                />
                <View style={styles.presenceTextBox}>
                  <Text style={[styles.presenceName, { color: theme.text }]} numberOfLines={1}>
                    {item.isCurrentUser ? "Voce" : item.user?.name || "Membro"}
                  </Text>
                  <Text style={[styles.presenceStatus, { color: isOnline ? theme.success : theme.textMuted }]} numberOfLines={1}>
                    {isOnline ? "online" : formatLastSeen(item.lastSeenAt)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.activityActions}
        >
          {activityPrompts.map((prompt) => (
            <Pressable
              key={prompt.id}
              onPress={() => handleUsePrompt(prompt.text)}
              style={({ pressed }) => [
                styles.activityChip,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.78, transform: [{ scale: 0.99 }] }
              ]}
            >
              <IconSymbol name={prompt.icon} size={16} color={theme.primary} />
              <Text style={[styles.activityChipText, { color: theme.text }]} numberOfLines={1}>
                {prompt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.feed, { backgroundColor: theme.surfaceMuted }]}>
        {isChatLoading ? (
          <View style={styles.chatLoading}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.chatLoadingText, { color: theme.textMuted }]}>Abrindo conversa...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <IconSymbol name="chat-plus-outline" size={28} color={theme.primary} />
            <Text style={[styles.emptyChatTitle, { color: theme.text }]}>Comece a conversa</Text>
            <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>
              Combine prazos, divida tarefas e mantenha todo mundo no mesmo ritmo.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            style={styles.chatMessagesScroll}
            contentContainerStyle={styles.chatMessages}
            initialNumToRender={20}
            maxToRenderPerBatch={12}
            updateCellsBatchingPeriod={40}
            windowSize={7}
            removeClippedSubviews={Platform.OS === "android"}
            onScroll={handleChatScroll}
            scrollEventThrottle={32}
            onLayout={() => {
              if (stickToBottomRef.current) {
                scrollChatToEnd(false);
              }
            }}
            onContentSizeChange={() => {
              if (stickToBottomRef.current) {
                scrollChatToEnd(false);
              }
            }}
          />
        )}
      </View>

      <View style={[styles.composer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Mensagem para a equipe"
          placeholderTextColor={theme.textSoft}
          multiline
          onFocus={() => scrollChatToEnd(true)}
          style={[
            styles.composerInput,
            {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.borderStrong,
              color: theme.text,
              maxHeight: isMobile ? 94 : 118
            }
          ]}
        />
        <Pressable
          onPress={handleSendMessage}
          disabled={isSendingMessage || !messageText.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: theme.primary },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            (isSendingMessage || !messageText.trim()) && { opacity: 0.55 }
          ]}
        >
          {isSendingMessage ? (
            <ActivityIndicator color={theme.white} />
          ) : (
            <IconSymbol name="send" size={20} color={theme.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const ChatMessageItem = memo(function ChatMessageItem({
  message,
  senderName,
  isMine,
  isMobile
}: {
  message: CollaborationMessage;
  senderName: string;
  isMine: boolean;
  isMobile: boolean;
}) {
  const { theme } = useThemeMode();
  const bubbleMaxWidth = isMobile ? "76%" : "68%";
  const avatar = (
    <CollaborationUserAvatar
      user={message.user}
      size={34}
      backgroundColor={isMine ? theme.primarySoft : theme.surface}
      borderColor={isMine ? theme.primary : theme.border}
      textColor={isMine ? theme.primary : theme.textMuted}
    />
  );

  return (
    <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
      {!isMine ? avatar : null}
      <View style={[
        styles.messageBubble,
        {
          maxWidth: bubbleMaxWidth,
          backgroundColor: isMine ? theme.primary : theme.surface,
          borderColor: isMine ? theme.primary : theme.border
        }
      ]}>
        <View style={styles.messageMeta}>
          <Text style={[styles.messageAuthor, { color: isMine ? theme.white : theme.text }]} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={[styles.messageTime, { color: isMine ? "rgba(255,255,255,0.76)" : theme.textMuted }]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
        <Text selectable style={[styles.messageBody, { color: isMine ? theme.white : theme.text }]}>
          {message.message}
        </Text>
      </View>
      {isMine ? avatar : null}
    </View>
  );
});

const styles = StyleSheet.create({
  room: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden"
  },
  roomTop: {
    borderBottomWidth: 1,
    padding: spacing.md,
    gap: spacing.md
  },
  roomTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  roomIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  roomTitleBox: {
    flex: 1,
    minWidth: 0
  },
  roomTitle: {
    fontFamily: fonts.title,
    fontSize: 17
  },
  roomSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2
  },
  liveBadge: {
    minHeight: 30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  liveText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  presenceStrip: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  presencePill: {
    minHeight: 56,
    minWidth: 148,
    maxWidth: 210,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  presenceTextBox: {
    flex: 1,
    minWidth: 0
  },
  presenceName: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  presenceStatus: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2
  },
  activityActions: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  activityChip: {
    minHeight: 38,
    maxWidth: 180,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  activityChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    flexShrink: 1
  },
  feed: {
    flex: 1
  },
  chatMessagesScroll: {
    flex: 1
  },
  chatMessages: {
    padding: spacing.md,
    gap: spacing.md
  },
  chatLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  chatLoadingText: {
    fontFamily: fonts.medium,
    fontSize: 13
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  emptyChatTitle: {
    fontFamily: fonts.title,
    fontSize: 18,
    marginTop: spacing.sm
  },
  emptyChatText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: spacing.xs
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm
  },
  messageRowMine: {
    justifyContent: "flex-end"
  },
  messageBubble: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  messageAuthor: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  messageTime: {
    fontFamily: fonts.medium,
    fontSize: 10
  },
  messageBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20
  },
  composer: {
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top"
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center"
  }
});
