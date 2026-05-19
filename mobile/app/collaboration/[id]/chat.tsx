import { useCallback, useState } from "react";
import { Alert, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { PageHeader } from "../../../src/components/PageHeader";
import { ScreenLayout } from "../../../src/components/ScreenLayout";
import { Button, EmptyState, LoadingState } from "../../../src/components/ui";
import { CollaborationChatRoom } from "../../../src/components/collaboration/CollaborationChatRoom";
import { CollaborationGroup } from "../../../src/types/entities";
import { getCollaborationGroupRequest } from "../../../src/services/collaboration";
import { spacing } from "../../../src/theme";

export default function CollaborationChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = String(params.id || "");
  const [group, setGroup] = useState<CollaborationGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroup = useCallback(async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      const loadedGroup = await getCollaborationGroupRequest(groupId);
      setGroup(loadedGroup);
    } catch (error: any) {
      Alert.alert("Erro", error?.response?.data?.message || "Nao foi possivel carregar o chat.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => {
    loadGroup();
  }, [loadGroup]));

  return (
    <ScreenLayout scroll={false}>
      {({ openMenu, isWide }) => (
        <View style={styles.screen}>
          <PageHeader
            title={group?.name || "Chat"}
            subtitle="Conversa dedicada do grupo"
            onMenu={isWide ? undefined : openMenu}
            right={
              <Button
                title="Grupo"
                icon="arrow-left"
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/collaboration/${groupId}` as any)}
              />
            }
          />

          {isLoading ? (
            <LoadingState label="Carregando chat..." />
          ) : !group ? (
            <EmptyState
              iconName="message-alert-outline"
              title="Chat indisponivel"
              description="Verifique se voce ainda faz parte deste grupo."
            />
          ) : (
            <View style={styles.chatShell}>
              <CollaborationChatRoom groupId={groupId} group={group} />
            </View>
          )}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = {
  screen: {
    flex: 1
  },
  chatShell: {
    flex: 1,
    minHeight: 0,
    paddingBottom: spacing.sm
  }
};
