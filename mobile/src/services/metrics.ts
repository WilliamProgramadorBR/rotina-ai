import { api } from "./api";
import { DashboardMetrics } from "@/types/api";

export async function getDashboardMetricsRequest() {
  const { data } = await api.get<{ metrics: DashboardMetrics }>("/metrics/dashboard");

  return data.metrics;
}
