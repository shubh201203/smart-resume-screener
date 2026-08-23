import type {
  APIResponse, ProjectSummary, ProjectDetail, CandidateDetail,
  AnalyticsData, ComparisonResult
} from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  const json: APIResponse<T> = await res.json();
  if (!json.success || json.error) {
    throw new Error(json.error?.message || 'API request failed');
  }

  return json.data as T;
}

export const api = {
  // Projects
  getProjects: () => fetchJSON<ProjectSummary[]>('/projects'),
  getProject: (id: string) => fetchJSON<ProjectDetail>(`/projects/${id}`),
  createProject: (title: string, department?: string) =>
    fetchJSON<{ id: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, department }),
    }),

  // Jobs
  createJob: (projectId: string, title: string, rawDescription: string) =>
    fetchJSON<{ id: string; title: string }>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, title, raw_description: rawDescription }),
    }),

  // Resume Upload
  uploadResumes: async (projectId: string, files: File[]) => {
    const formData = new FormData();
    formData.append('project_id', projectId);
    files.forEach((file) => formData.append('files', file));

    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'Upload failed');
    }
    return json.data;
  },

  // Run Screening
  runScreening: (projectId: string) =>
    fetchJSON<{ screened_count: number; message: string }>(`/screening/${projectId}/run`, {
      method: 'POST',
    }),

  // Candidates
  getCandidate: (id: string) => fetchJSON<CandidateDetail>(`/candidates/${id}`),
  updateCandidateStatus: (id: string, action_status: string) =>
    fetchJSON<{ id: string; action_status: string }>(`/candidates/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ action_status }),
    }),
  addNote: (id: string, note_text: string) =>
    fetchJSON<{ id: string; note_text: string }>(`/candidates/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note_text }),
    }),

  // Compare Candidates
  compareCandidates: (candidateIds: string[]) =>
    fetchJSON<ComparisonResult>('/candidates/compare', {
      method: 'POST',
      body: JSON.stringify({ candidate_ids: candidateIds }),
    }),

  // Analytics & Export
  getAnalytics: (projectId: string) => fetchJSON<AnalyticsData>(`/analytics/${projectId}`),
  getExportUrl: (projectId: string) => `${API_BASE}/export/${projectId}/csv`,

  // Demo Mode
  loadDemoData: () => fetchJSON<{ project_id: string; message: string }>('/demo/load', { method: 'POST' }),
};
