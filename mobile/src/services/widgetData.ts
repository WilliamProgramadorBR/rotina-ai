import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export interface WidgetData {
  userName: string;
  streakDays: number;
  completionRate: number;
  reminders: Array<{ time: string; title: string; done: boolean }>;
}

const WIDGET_DATA_PATH =
  Platform.OS === "android" ? FileSystem.documentDirectory + "rotina-widget-data.json" : null;

export async function saveWidgetData(data: WidgetData): Promise<void> {
  if (!WIDGET_DATA_PATH) return;
  try {
    await FileSystem.writeAsStringAsync(WIDGET_DATA_PATH, JSON.stringify(data));
  } catch {}
}

export async function loadWidgetData(): Promise<WidgetData | null> {
  if (!WIDGET_DATA_PATH) return null;
  try {
    const info = await FileSystem.getInfoAsync(WIDGET_DATA_PATH);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(WIDGET_DATA_PATH);
    return JSON.parse(raw) as WidgetData;
  } catch {
    return null;
  }
}

export function formatReminderTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "--:--";
  }
}
