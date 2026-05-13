import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Directory, File, Paths } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

const CUSTOM_RINGTONE_KEY = "rotina-ai-custom-ringtone";
const CUSTOM_RINGTONE_DIR = "custom-ringtones";
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;

export type CustomRingtone = {
  uri: string;
  name: string;
  type?: string;
  size?: number;
  savedAt: string;
};

let activePlayer: AudioPlayer | null = null;

function isPickerCancelled(error: any) {
  return String(error?.message || error || "")
    .toLowerCase()
    .includes("cancel");
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getAudioExtension(file: File) {
  const extension = file.extension || "";

  if (extension) {
    return extension.toLowerCase();
  }

  const type = file.type || "";

  if (type.includes("mpeg")) return ".mp3";
  if (type.includes("wav")) return ".wav";
  if (type.includes("ogg")) return ".ogg";
  if (type.includes("aac")) return ".aac";
  if (type.includes("m4a") || type.includes("mp4")) return ".m4a";

  return ".mp3";
}

function assertAudioFile(file: File) {
  const type = String(file.type || "").toLowerCase();
  const extension = getAudioExtension(file);
  const isAudio =
    type.startsWith("audio/") ||
    [".mp3", ".m4a", ".aac", ".wav", ".ogg", ".opus", ".flac"].includes(extension);

  if (!isAudio) {
    throw new Error("Escolha um arquivo de audio.");
  }

  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    throw new Error("Escolha um audio com ate 25 MB.");
  }
}

async function deleteStoredFile(uri?: string) {
  if (!uri) return;

  try {
    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.log("[CUSTOM RINGTONE DELETE ERROR]", error);
  }
}

async function copyPickedFileToStorage(sourceFile: File, targetFile: File) {
  if (sourceFile.uri.startsWith("content://")) {
    await LegacyFileSystem.copyAsync({
      from: sourceFile.uri,
      to: targetFile.uri
    });
    return;
  }

  sourceFile.copy(targetFile);
}

export async function getCustomRingtone(): Promise<CustomRingtone | null> {
  try {
    const raw = await SecureStore.getItemAsync(CUSTOM_RINGTONE_KEY);

    if (!raw) return null;

    return JSON.parse(raw) as CustomRingtone;
  } catch (error) {
    console.log("[CUSTOM RINGTONE LOAD ERROR]", error);
    return null;
  }
}

export async function pickCustomRingtone(): Promise<CustomRingtone | null> {
  if (Platform.OS === "web") {
    throw new Error("Escolha de audio disponivel apenas no app instalado.");
  }

  try {
    const picked = await File.pickFileAsync(undefined, "audio/*");
    const sourceFile = Array.isArray(picked) ? picked[0] : picked;

    if (!sourceFile) {
      return null;
    }

    assertAudioFile(sourceFile);

    const currentRingtone = await getCustomRingtone();
    const ringtoneDirectory = new Directory(Paths.document, CUSTOM_RINGTONE_DIR);

    ringtoneDirectory.create({
      idempotent: true,
      intermediates: true
    });

    const extension = getAudioExtension(sourceFile);
    const safeBaseName = sanitizeFileName(sourceFile.name.replace(/\.[^.]+$/, "")) || "toque";
    const targetFile = new File(
      ringtoneDirectory,
      `${Date.now()}-${safeBaseName}${extension}`
    );

    await copyPickedFileToStorage(sourceFile, targetFile);
    await deleteStoredFile(currentRingtone?.uri);

    const ringtone: CustomRingtone = {
      uri: targetFile.uri,
      name: sourceFile.name || targetFile.name,
      type: sourceFile.type || undefined,
      size: sourceFile.size || undefined,
      savedAt: new Date().toISOString()
    };

    await SecureStore.setItemAsync(CUSTOM_RINGTONE_KEY, JSON.stringify(ringtone));

    return ringtone;
  } catch (error: any) {
    if (isPickerCancelled(error)) {
      return null;
    }

    throw error;
  }
}

export async function clearCustomRingtone() {
  const currentRingtone = await getCustomRingtone();

  await stopAlarmRingtone();
  await deleteStoredFile(currentRingtone?.uri);
  await SecureStore.deleteItemAsync(CUSTOM_RINGTONE_KEY);
}

export async function playAlarmRingtone() {
  const ringtone = await getCustomRingtone();

  if (!ringtone) {
    return null;
  }

  await stopAlarmRingtone();
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "doNotMix",
    allowsRecording: false,
    shouldPlayInBackground: true,
    shouldRouteThroughEarpiece: false
  });

  activePlayer = createAudioPlayer(
    {
      uri: ringtone.uri,
      name: ringtone.name
    },
    {
      updateInterval: 1000
    }
  );
  activePlayer.loop = true;
  activePlayer.volume = 1;
  activePlayer.setActiveForLockScreen(
    true,
    {
      title: "Alarme ativo",
      artist: "Rotina AI",
      albumTitle: ringtone.name
    },
    {
      showSeekBackward: false,
      showSeekForward: false
    }
  );
  activePlayer.play();

  return ringtone;
}

export async function stopAlarmRingtone() {
  if (!activePlayer) {
    return;
  }

  try {
    activePlayer.pause();
    activePlayer.clearLockScreenControls();
    activePlayer.remove();
  } catch (error) {
    console.log("[CUSTOM RINGTONE STOP ERROR]", error);
  } finally {
    activePlayer = null;
  }
}
