import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// GET /admin/metrics. Dates are "YYYY-MM-DD" in UTC; rates are 0–1, null without data.
export interface ProductMetrics {
  weekStart: string;
  periodStart: string;
  thisWeek: {
    activeUsers: number;
    newUsers: number;
    studyCycle: { read: number; asked: number; saved: number; reviewed: number };
  };
  period: {
    explanationsPerActiveDay: number | null;
    reviewAccuracy: number | null;
    examAccuracy: number | null;
    aiCards: { proposed: number; kept: number; edited: number };
  };
  retention: { cohortWeek: string; users: number; retained: number[] }[];
}

// Mirrors RETENTION_WEEKS in the API.
export const RETENTION_WEEKS = 8;

export const useProductMetrics = () =>
  useQuery<ProductMetrics>({
    queryKey: ["admin", "metrics"],
    queryFn: async () => (await api.get<ProductMetrics>("/admin/metrics")).data,
    // A 403 won't change by retrying.
    retry: false,
  });
