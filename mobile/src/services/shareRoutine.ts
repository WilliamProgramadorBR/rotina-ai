import { RefObject } from "react";
import { View, Platform } from "react-native";
import * as Sharing from "expo-sharing";

export async function isSharingAvailable(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function captureAndShare(
  viewShotRef: RefObject<{ capture?: () => Promise<string> }>,
  fileName = "rotina-ai-rotina.png"
): Promise<void> {
  if (!viewShotRef.current) {
    throw new Error("Card de compartilhamento não está pronto.");
  }

  const uri = await viewShotRef.current.capture?.();

  if (!uri) {
    throw new Error("Nao foi possivel gerar a imagem da rotina.");
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Compartilhamento não está disponível neste dispositivo.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: "Compartilhar minha rotina",
    UTI: "public.png"
  });
}
