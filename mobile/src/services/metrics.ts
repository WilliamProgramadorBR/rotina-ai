import { api } from "./api";
import { CollaborationDashboardMetrics, DashboardMetrics } from "@/types/api";

export async function getDashboardMetricsRequest() {
  const { data } = await api.get<{ metrics: DashboardMetrics }>("/metrics/dashboard");

  return data.metrics;
}

export async function getCollaborationDashboardMetricsRequest() {
  const { data } = await api.get<{ metrics: CollaborationDashboardMetrics }>("/metrics/collaboration/dashboard");

  return data.metrics;
}
