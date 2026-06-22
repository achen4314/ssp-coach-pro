import apiClient from './client';

export interface Athlete {
  id: number;
  name: string;
  phone: string;
  gender: string;
  birth_date: string;
  source: string;
  hyrox_interest: string;
  sport_background: string;
  current_client_type: string;
  notes: string;
  coach_id: number;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  athlete_id: number;
  assessment_type: string;
  total_score: number;
  weaknesses: string;
  coach_feedback: string;
  created_at: string;
}

export interface AthleteListParams {
  page?: number;
  per_page?: number;
  name?: string;
  current_client_type?: string;
  source?: string;
  coach_id?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export const athletesApi = {
  list: (params?: AthleteListParams) =>
    apiClient.get<PaginatedResponse<Athlete>>('/athletes', { params }),

  get: (id: number) =>
    apiClient.get<Athlete>(`/athletes/${id}`),

  create: (data: Partial<Athlete>) =>
    apiClient.post<Athlete>('/athletes', data),

  update: (id: number, data: Partial<Athlete>) =>
    apiClient.put<Athlete>(`/athletes/${id}`, data),

  getAssessments: (id: number) =>
    apiClient.get<PaginatedResponse<Assessment>>(`/athletes/${id}/assessments`),
};
