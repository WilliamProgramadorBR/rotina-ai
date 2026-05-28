import { api } from "./api";

export type InsightTip = {
  type: "celebration" | "pattern" | "warning" | "suggestion";
  icon: string;
  title: string;
  text: string;
};

export type DailyInsights = {
  score: number;
  trend: "up" | "down" | "stable";
  headline: string;
  tips: InsightTip[];
  bestPeriod: string | null;
  weakCategory: string | null;
  strongCategory: string | null;
  generatedAt: string;
};

export type DailyInsightsResponse = {
  insights: DailyInsights;
  cached: boolean;
  generatedAt: string;
};

export async function getDailyInsightsRequest(): Promise<DailyInsightsResponse> {
  const res = await api.get("/ai/daily-insights");
  return res.data;
}

export async function getWeekRemindersRequest(startDate: string, endDate: string) {
  const res = await api.get("/reminders/range", { params: { start: startDate, end: endDate } });
  return res.data.reminders || [];
}
