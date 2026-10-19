import React, { useState, useEffect } from 'react';
import { Play, Download, Upload, CheckCircle2, AlertTriangle, ArrowLeft, Sparkles, Sliders, X, Check } from 'lucide-react';
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
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [weightsInput, setWeightsInput] = useState<Record<string, number>>({
    skills: 35,
    experience: 20,
    semantic_fit: 20,
    projects: 15,
    education: 5,
    certifications: 5,
  });
  const [savingWeights, setSavingWeights] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await api.getProject(projectId);
      setProject(data);
      if (data.scoring_weights) {
        setWeightsInput({
          skills: Math.round((data.scoring_weights.skills || 0.35) * 100),
          experience: Math.round((data.scoring_weights.experience || 0.20) * 100),
          semantic_fit: Math.round((data.scoring_weights.semantic_fit || 0.20) * 100),
          projects: Math.round((data.scoring_weights.projects || 0.15) * 100),
          education: Math.round((data.scoring_weights.education || 0.05) * 100),
          certifications: Math.round((data.scoring_weights.certifications || 0.05) * 100),
        });
      }
    } catch (err: any) {
      showToast('error', `Failed to load project: ${err.message}`);
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
      showToast('success', 'Candidate screening and ranking completed.');
      await loadProject();
    } catch (err: any) {
      showToast('error', `Screening failed: ${err.message}`);
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
      showToast('success', 'Job description parsed and saved.');
      await loadProject();
    } catch (err: any) {
      showToast('error', `Job creation failed: ${err.message}`);
    } finally {
      setCreatingJob(false);
    }
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await api.updateCandidateStatus(candidateId, newStatus);
      showToast('success', `Candidate status updated to ${newStatus}.`);
      await loadProject();
    } catch (err: any) {
      showToast('error', `Failed to update status: ${err.message}`);
    }
  };

  const handleSaveWeights = async () => {
    const total = Object.values(weightsInput).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      showToast('error', `Weights must sum to 100%. Current total: ${total}%`);
      return;
    }
    try {
      setSavingWeights(true);
      const res = await api.updateProjectWeights(projectId, weightsInput);
      setShowWeightsModal(false);
      showToast('success', res.message || 'Scoring weights updated and rankings recalculated.');
      await loadProject();
    } catch (err: any) {
      showToast('error', `Failed to save weights: ${err.message}`);
    } finally {
      setSavingWeights(false);
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
            onClick={() => setShowWeightsModal(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer border border-slate-700"
            title="Configure role-specific deterministic scoring weights"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Scoring Weights</span>
          </button>

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

      {/* Accessible Toast Notification */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

      {/* Role-Specific Scoring Weights Modal */}
      {showWeightsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="weights-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="weights-modal-title" className="text-base font-bold text-white">Project Scoring Weights</h3>
                  <p className="text-xs text-slate-400">Custom weights persist to DB and automatically recalculate rankings</p>
                </div>
              </div>
              <button
                onClick={() => setShowWeightsModal(false)}
                aria-label="Close weights modal"
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Weights Sliders */}
            <div className="space-y-3.5 text-xs">
              {[
                { key: 'skills', label: 'Skills Match Coverage', color: 'text-emerald-400', max: 60 },
                { key: 'experience', label: 'Professional Experience', color: 'text-indigo-400', max: 50 },
                { key: 'semantic_fit', label: 'Semantic Job Fit', color: 'text-purple-400', max: 40 },
                { key: 'projects', label: 'Project Relevance', color: 'text-amber-400', max: 30 },
                { key: 'education', label: 'Education Alignment', color: 'text-cyan-400', max: 20 },
                { key: 'certifications', label: 'Certifications Fit', color: 'text-pink-400', max: 20 },
              ].map(({ key, label, color, max }) => (
                <div key={key}>
                  <div className="flex justify-between font-semibold text-slate-300 mb-1">
                    <span>{label}</span>
                    <span className={`font-bold ${color}`}>{weightsInput[key] || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={max}
                    value={weightsInput[key] || 0}
                    onChange={(e) =>
                      setWeightsInput({ ...weightsInput, [key]: Number(e.target.value) })
                    }
                    className="w-full cursor-pointer accent-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* Sum Indicator */}
            {(() => {
              const total = Object.values(weightsInput).reduce((a, b) => a + b, 0);
              return (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Total Sum:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full border ${
                      total === 100
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {total}% {total === 100 ? '✓ Ready' : `(needs ${100 - total}% adjustment)`}
                  </span>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWeightsModal(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWeights}
                disabled={savingWeights}
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                {savingWeights ? 'Recalculating...' : 'Save & Re-Score'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
