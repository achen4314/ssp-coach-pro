import apiClient from './client';

// ── Types ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_athletes: number;
  new_this_month: number;
  assessments_this_month: number;
  assessments_target: number;
  pending_followups: number;
  overdue_followups: number;
  conversion_rate_this_month: number;
  conversion_rate_last_month: number;
  conversion_trend: 'up' | 'down' | 'flat';
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

export interface AudienceSegment {
  type: string;
  label: string;
  count: number;
  pct: number;
  conversion_rate: number;
  avg_score: number;
}

export interface SourceConversion {
  source: string;
  total: number;
  assessed: number;
  converted: number;
  conversion_rate: number;
}

export interface TodoItem {
  id: number;
  athlete_name: string;
  due_date?: string;
  description?: string;
}

export interface Todos {
  pending_assessments: TodoItem[];
  pending_followups: TodoItem[];
  overdue: TodoItem[];
  pending_logs: TodoItem[];
}

// ── API functions ──────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats').then((r) => r.data),

  getFunnel: () =>
    apiClient.get<FunnelStage[]>('/dashboard/funnel').then((r) => r.data),

  getAudience: () =>
    apiClient.get<AudienceSegment[]>('/dashboard/audience').then((r) => r.data),

  getSourceConversion: () =>
    apiClient.get<SourceConversion[]>('/dashboard/source-conversion').then((r) => r.data),

  getTodos: () =>
    apiClient.get<Todos>('/dashboard/todos').then((r) => r.data),
};
