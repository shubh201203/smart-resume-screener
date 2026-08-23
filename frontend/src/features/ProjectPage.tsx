import React, { useState, useEffect } from 'react';
import { Play, Download, Upload, CheckCircle2, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import type { ProjectDetail } from '../types';
import { api } from '../services/api';
import { Dropzone } from '../components/Dropzone';
import { CandidateTable } from '../components/CandidateTable';
import { CandidateCompareModal } from '../components/CandidateCompareModal';
import { FairnessNotice } from '../components/FairnessNotice';

interface ProjectPageProps {
  projectId: string;
  onBack: () => void;
  onSelectCandidate: (id: string) => void;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({ projectId, onBack, onSelectCandidate }) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningScreening, setRunningScreening] = useState(false);
  const [showDropzone, setShowDropzone] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [creatingJob, setCreatingJob] = useState(false);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (err: any) {
      alert(`Failed to load project: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleRunScreening = async () => {
    try {
      setRunningScreening(true);
      await api.runScreening(projectId);
      await loadProject();
    } catch (err: any) {
      alert(`Screening failed: ${err.message}`);
    } finally {
      setRunningScreening(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobDescriptionInput.trim()) return;
    try {
      setCreatingJob(true);
      await api.createJob(projectId, project?.title || 'Target Job', jobDescriptionInput);
      setJobDescriptionInput('');
      await loadProject();
    } catch (err: any) {
      alert(`Job creation failed: ${err.message}`);
    } finally {
      setCreatingJob(false);
    }
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await api.updateCandidateStatus(candidateId, newStatus);
      await loadProject();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (loading || !project) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">Loading project intelligence...</p>
      </div>
    );
  }

  const parsedJob = project.job?.parsed;

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-black text-white">{project.title}</h1>
          <p className="text-xs text-slate-400">
            Department: {project.department} • Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDropzone(!showDropzone)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>{showDropzone ? 'Hide Upload' : 'Upload Resumes'}</span>
          </button>

          <button
            onClick={handleRunScreening}
            disabled={runningScreening || !project.candidates.length || !project.job}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {runningScreening ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{runningScreening ? 'Screening Candidates...' : 'Run AI Screening'}</span>
          </button>

          <a
            href={api.getExportUrl(projectId)}
            download
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Fairness & Bias Disclaimer */}
      <FairnessNotice />

      {/* Upload Dropzone Collapse Area */}
      {showDropzone && (
        <Dropzone
          projectId={projectId}
          onUploadSuccess={() => {
            setShowDropzone(false);
            loadProject();
          }}
        />
      )}

      {/* Job Description & Requirements Analysis Card */}
      {!project.job ? (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Job Description Required for Matching</span>
          </div>
          <p className="text-xs text-slate-400">
            Paste the job description below. The AI will extract structured required vs preferred skills, experience years, and certifications.
          </p>

          <textarea
            rows={5}
            placeholder="Paste Job Description text here..."
            value={jobDescriptionInput}
            onChange={(e) => setJobDescriptionInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded-xl focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={handleCreateJob}
            disabled={creatingJob || !jobDescriptionInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl cursor-pointer"
          >
            {creatingJob ? 'Analyzing Job Requirements...' : 'Analyze & Save Job Description'}
          </button>
        </div>
      ) : (
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">AI-Extracted Job Requirements Analysis</h2>
            </div>
            <span className="text-xs text-indigo-400 font-semibold">
              Seniority: {parsedJob?.seniority || 'Mid-Senior'} • Req Experience: {parsedJob?.required_experience_years || 2.0} yrs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Required Skills */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Required Skills (Must-Haves)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedJob?.required_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                  >
                    REQUIRED: {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preferred Skills (Nice-to-Haves)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedJob?.preferred_skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                  >
                    PREFERRED: {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Table */}
      <CandidateTable
        candidates={project.candidates}
        onSelectCandidate={onSelectCandidate}
        onCompareSelected={(selectedIds) => setCompareIds(selectedIds)}
        onStatusChange={handleStatusChange}
      />

      {/* Side-by-Side Comparison Modal */}
      {compareIds.length > 0 && (
        <CandidateCompareModal
          candidateIds={compareIds}
          onClose={() => setCompareIds([])}
        />
      )}
    </div>
  );
};
