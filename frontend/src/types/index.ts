export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ProjectSummary {
  id: string;
  title: string;
  department: string;
  candidate_count: number;
  has_job: boolean;
  created_at: string;
}

export interface JobParsedData {
  job_title?: string;
  seniority?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  required_experience_years?: number;
  education_requirements?: string[];
  certifications?: string[];
  responsibilities?: string[];
  technologies?: string[];
  soft_skills?: string[];
}

export interface JobDetail {
  id: string;
  title: string;
  raw_description: string;
  parsed: JobParsedData;
}

export interface ComponentScores {
  skills: number;
  experience: number;
  semantic_fit: number;
  projects: number;
  education: number;
  certifications: number;
  final_score: number;
}

export interface SkillMatchItem {
  skill: string;
  status: string;
  confidence: number;
  evidence: string;
  type: string;
}

export interface MatchScoreData {
  overall_score: number;
  component_scores: ComponentScores;
  recommendation: 'Strong Match' | 'Consider' | 'Low Match' | string;
  confidence: 'High' | 'Medium' | 'Low' | string;
  matched_skills?: SkillMatchItem[];
  partial_matches?: Array<{ skill: string; candidate_skill?: string; evidence?: string; type?: string }>;
  missing_skills?: Array<{ skill: string; type?: string }>;
  evidence?: Record<string, any>;
  strengths?: string[];
  concerns?: string[];
  why_not_10?: string[];
  ai_justification?: string;
  engine_type?: string;
  model_name?: string;
}

export interface CandidateSummary {
  id: string;
  name: string;
  email?: string;
  location?: string;
  total_years_experience: number;
  pipeline_state: string;
  action_status: string;
  overall_score: number | null;
  recommendation: string;
  confidence: string;
  resume_quality: string;
  matched_skills: string[];
  missing_skills: string[];
}

export interface ProjectDetail {
  id: string;
  title: string;
  department: string;
  scoring_weights?: Record<string, number>;
  created_at: string;
  job: JobDetail | null;
  candidates: CandidateSummary[];
}

export interface RecruiterNote {
  id: string;
  note_text: string;
  author: string;
  created_at: string;
}

export interface CandidateDetail {
  id: string;
  project_id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  total_years_experience: number;
  pipeline_state: string;
  action_status: string;
  extracted_data?: any;
  match_score: MatchScoreData | null;
  resume?: {
    id: string;
    filename: string;
    file_size: number;
    quality_score: number;
    quality_label: string;
    quality_factors?: string[];
    raw_text: string;
  };
  notes?: RecruiterNote[];
}

export interface AnalyticsData {
  total_candidates: number;
  screened_count: number;
  strong_matches_count: number;
  average_score: number;
  median_score: number;
  processing_success_rate: number;
  score_distribution: Array<{ range: string; count: number }>;
  recommendation_breakdown: Record<string, number>;
  top_required_skills: string[];
  candidate_skill_coverage: Array<{ skill: string; coverage_pct: number; count: number }>;
  common_missing_gaps: Array<{ skill: string; gap_count: number }>;
}

export interface ComparisonResult {
  job_title: string;
  candidates: Array<{
    id: string;
    name: string;
    email?: string;
    total_years_experience: number;
    overall_score: number;
    recommendation: string;
    component_scores: ComponentScores;
    matched_skills: string[];
    missing_skills: string[];
    strengths: string[];
    why_not_10: string[];
  }>;
  comparison_summary: string;
}
