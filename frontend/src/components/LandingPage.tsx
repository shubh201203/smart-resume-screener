import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Cpu, CheckCircle2, ArrowRight, Play, BarChart3 } from 'lucide-react';
import { api } from '../services/api';

interface LandingPageProps {
  onStartScreening: () => void;
  onDemoLoaded: (projectId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartScreening, onDemoLoaded }) => {
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleTryDemo = async () => {
    try {
      setLoadingDemo(true);
      const res = await api.loadDemoData();
      onDemoLoaded(res.project_id);
    } catch (err: any) {
      alert(`Failed to load demo data: ${err.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>SmartResume AI Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          AI-powered resume screening that <span className="bg-gradient-to-r from-indigo-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">explains every match.</span>
        </h1>

        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Turn hundreds of resumes into an evidence-based candidate shortlist using semantic matching, transparent scoring, and recruiter-friendly explanations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onStartScreening}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>START SCREENING</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleTryDemo}
            disabled={loadingDemo}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loadingDemo ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{loadingDemo ? 'LOADING DEMO...' : 'TRY DEMO'}</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Diagram */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-5xl mx-auto space-y-4">
        <div className="text-center">
          <h3 className="text-xs uppercase font-bold text-indigo-400 tracking-widest">End-to-End Pipeline</h3>
          <p className="text-sm font-semibold text-white mt-1">How SmartResume AI Evaluates Candidates</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs pt-2">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-slate-200">1. RESUME</div>
            <div className="text-[10px] text-slate-500">PDF / TXT Upload</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-indigo-400">2. EXTRACTION</div>
            <div className="text-[10px] text-slate-500">Structured Data</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-purple-400">3. SEMANTIC</div>
            <div className="text-[10px] text-slate-500">LLM Reasoning</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-emerald-400">4. EVIDENCE</div>
            <div className="text-[10px] text-slate-500">Resume Quotes</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-amber-400">5. SCORING</div>
            <div className="text-[10px] text-slate-500">Deterministic Math</div>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-teal-400">6. RANKING</div>
            <div className="text-[10px] text-slate-500">Shortlist & Why Not</div>
          </div>
        </div>
      </div>

      {/* 4 Key Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">1. Hybrid AI Architecture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Combines deep semantic understanding from LLMs with a deterministic weighted scoring engine so final match scores (1-10) remain consistent, explainable, and reproducible.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">2. Evidence-Based Matching</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every skill match, partial overlap, or missing requirement is backed by direct text snippets extracted from the candidate's resume—never fabricated or hallucinated.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">3. Transparent Weighted Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Replaces black-box opaque numbers with explicit weight breakdowns (Skills 35%, Experience 20%, Semantic Fit 20%, Projects 15%, Education 5%, Certifications 5%).
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">4. Fairness & Bias Guardrails</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically scrubs and excludes protected characteristics (gender, race, age, religion, photos) and ranks candidates purely on job-relevant qualifications.
          </p>
        </div>
      </div>
    </div>
  );
};
