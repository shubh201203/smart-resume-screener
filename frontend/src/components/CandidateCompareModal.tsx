import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Sparkles, Columns, Loader2 } from 'lucide-react';
import type { ComparisonResult } from '../types';
import { api } from '../services/api';
import { ScoreWheel } from './ScoreWheel';

interface CandidateCompareModalProps {
  candidateIds: string[];
  onClose: () => void;
}

export const CandidateCompareModal: React.FC<CandidateCompareModalProps> = ({ candidateIds, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ComparisonResult | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await api.compareCandidates(candidateIds);
        setData(res);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load candidate comparison');
      } finally {
        setLoading(false);
      }
    };
    loadComparison();
  }, [candidateIds]);

  if (!candidateIds.length) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compare-modal-title" className="text-lg font-bold text-white">Side-by-Side Candidate Comparison</h2>
              <p className="text-xs text-slate-400">Evaluating {candidateIds.length} candidate profiles against role requirements</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close comparison modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          ) : loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium">Generating candidate trade-off matrix...</p>
            </div>
          ) : data ? (
            <>
              {/* AI Comparison Synthesis Card */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Comparative Assessment & Recommendation</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed italic">
                  "{data.comparison_summary}"
                </p>
              </div>

              {/* Multi-Candidate Grid Matrix */}
              <div className={`grid gap-4 ${data.candidates.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {data.candidates.map((cand) => (
                  <div key={cand.id} className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
                    {/* Header */}
                    <div className="text-center pb-3 border-b border-slate-800">
                      <h3 className="font-bold text-base text-white">{cand.name}</h3>
                      <p className="text-xs text-slate-400">{cand.total_years_experience.toFixed(1)} years experience</p>
                      <div className="mt-3 flex justify-center">
                        <ScoreWheel score={cand.overall_score} size="md" />
                      </div>
                    </div>

                    {/* Component Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Component Fit</span>
                        <span className="text-[10px] text-slate-500">Weight</span>
                      </div>

                      {cand.component_scores && (
                        <>
                          <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg">
                            <span className="text-slate-400">Skills (35%)</span>
                            <span className="font-bold text-emerald-400">{cand.component_scores.skills.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg">
                            <span className="text-slate-400">Experience (20%)</span>
                            <span className="font-bold text-indigo-400">{cand.component_scores.experience.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg">
                            <span className="text-slate-400">Semantic Job Fit (20%)</span>
                            <span className="font-bold text-purple-400">{cand.component_scores.semantic_fit.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg">
                            <span className="text-slate-400">Projects (15%)</span>
                            <span className="font-bold text-amber-400">{cand.component_scores.projects.toFixed(1)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Matched Skills */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Matched Skills ({cand.matched_skills.length})</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cand.matched_skills.map((skill, idx) => (
                          <span key={idx} className="bg-emerald-500/10 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Missing Gaps ({cand.missing_skills.length})</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cand.missing_skills.map((skill, idx) => (
                          <span key={idx} className="bg-rose-500/10 text-rose-300 text-[10px] px-2 py-0.5 rounded border border-rose-500/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
