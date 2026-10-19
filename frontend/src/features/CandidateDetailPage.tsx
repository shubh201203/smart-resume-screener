import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle2, HelpCircle, Briefcase, Sparkles, MessageSquare, Send, UserCheck, XCircle, Cpu, FileText
} from 'lucide-react';
import type { CandidateDetail } from '../types';
import { api } from '../services/api';
import { ScoreWheel } from '../components/ScoreWheel';
import { QualityBadge } from '../components/QualityBadge';

interface CandidateDetailPageProps {
  candidateId: string;
  onBack: () => void;
}

export const CandidateDetailPage: React.FC<CandidateDetailPageProps> = ({ candidateId, onBack }) => {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showRawResume, setShowRawResume] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadCandidate = async () => {
    try {
      setLoading(true);
      const data = await api.getCandidate(candidateId);
      setCandidate(data);
    } catch (err: any) {
      showToast('error', `Failed to load candidate: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  const handleStatusChange = async (status: string) => {
    try {
      await api.updateCandidateStatus(candidateId, status);
      showToast('success', `Candidate status updated to ${status}.`);
      await loadCandidate();
    } catch (err: any) {
      showToast('error', `Status update failed: ${err.message}`);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setSubmittingNote(true);
      await api.addNote(candidateId, newNote);
      setNewNote('');
      showToast('success', 'Recruiter note recorded.');
      await loadCandidate();
    } catch (err: any) {
      showToast('error', `Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading || !candidate) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">Extracting candidate intelligence profile...</p>
      </div>
    );
  }

  const match = candidate.match_score;
  const comp = match?.component_scores;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Candidates Table</span>
        </button>

        {feedback && (
          <div
            role="status"
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Candidate Profile Header Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-white">{candidate.name}</h1>
              <QualityBadge label={candidate.resume?.quality_label || 'Good'} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {candidate.email || 'No email specified'} • {candidate.phone || 'No phone'} • {candidate.location || 'Location unlisted'}
            </p>
            <p className="text-xs text-indigo-400 font-semibold mt-1">
              Total Professional Experience: {candidate.total_years_experience.toFixed(1)} Years
            </p>
          </div>
        </div>

        {/* Match Score & Action Buttons */}
        <div className="flex items-center space-x-6">
          <ScoreWheel score={match?.overall_score ?? null} size="lg" />

          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleStatusChange('SHORTLISTED')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                candidate.action_status === 'SHORTLISTED'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{candidate.action_status === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist Candidate'}</span>
            </button>

            <button
              onClick={() => handleStatusChange('REJECTED')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                candidate.action_status === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-700'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>{candidate.action_status === 'REJECTED' ? 'Rejected' : 'Reject Candidate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Scores, Skills, Timeline, Why Not 10 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Component Score Breakdown Card */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Score Component Breakdown</span>
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Engine: {match?.engine_type || 'LLM_HYBRID'}
              </span>
            </div>

            {comp && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400">Skills Match (35%)</div>
                  <div className="text-lg font-bold text-emerald-400">{comp.skills.toFixed(1)} / 10</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400">Experience (20%)</div>
                  <div className="text-lg font-bold text-indigo-400">{comp.experience.toFixed(1)} / 10</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400">Semantic Fit (20%)</div>
                  <div className="text-lg font-bold text-purple-400">{comp.semantic_fit.toFixed(1)} / 10</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400">Projects (15%)</div>
                  <div className="text-lg font-bold text-amber-400">{comp.projects.toFixed(1)} / 10</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400">Education (5%)</div>
                  <div className="text-lg font-bold text-teal-400">{comp.education.toFixed(1)} / 10</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-400">Certifications (5%)</div>
                  <div className="text-lg font-bold text-blue-400">{comp.certifications.toFixed(1)} / 10</div>
                </div>
              </div>
            )}
          </div>

          {/* Matched Skills & Evidence Badges */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Matched Skills & Extracted Evidence Snippets</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {match?.matched_skills?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">{item.skill}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-500/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Matched
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic leading-snug">
                    "{item.evidence}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* "WHY NOT 10/10?" Card */}
          {match?.why_not_10 && match.why_not_10.length > 0 && (
            <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>WHY NOT 10/10? Score Deduction Analysis</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {match.why_not_10.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Work Experience Timeline */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Extracted Work Experience Timeline</span>
            </h2>

            <div className="space-y-4 border-l-2 border-slate-800 pl-4">
              {candidate.extracted_data?.experience?.map((exp: any, idx: number) => (
                <div key={idx} className="space-y-1 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 absolute -left-[21px] top-1" />
                  <div className="text-sm font-bold text-slate-200">{exp.role}</div>
                  <div className="text-xs text-indigo-400 font-medium">
                    {exp.company} • {exp.start_date || ''} - {exp.end_date || 'Present'}
                  </div>
                  {exp.responsibilities && (
                    <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5 mt-1">
                      {exp.responsibilities.map((r: string, rIdx: number) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): AI Summary, Recruiter Notes, Raw Resume Toggle */}
        <div className="space-y-6">
          {/* AI Justification Summary */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Executive Justification</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{match?.ai_justification || candidate.summary}"
            </p>
          </div>

          {/* Recruiter Notes Editor */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Recruiter Evaluation Notes</span>
            </h2>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Add private candidate note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-3 rounded-xl focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              {candidate.notes?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
              ) : (
                candidate.notes?.map((n) => (
                  <div key={n.id} className="bg-slate-900/60 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{n.author}</span>
                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-200">{n.note_text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Raw Resume Text Toggle */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <button
              onClick={() => setShowRawResume(!showRawResume)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>View Extracted Resume Text</span>
              </span>
              <span className="text-indigo-400 underline">{showRawResume ? 'Hide' : 'View'}</span>
            </button>

            {showRawResume && (
              <pre className="mt-2 bg-slate-950 p-3 rounded-xl text-[11px] text-slate-400 overflow-x-auto max-h-60 whitespace-pre-wrap font-mono">
                {candidate.resume?.raw_text}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
