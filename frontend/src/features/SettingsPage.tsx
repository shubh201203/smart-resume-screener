import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Cpu, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [weights, setWeights] = useState({
    skills: 35,
    experience: 20,
    semantic_fit: 20,
    projects: 15,
    education: 5,
    certifications: 5,
  });

  const [saved, setSaved] = useState(false);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    if (totalWeight !== 100) {
      alert(`Scoring weights must sum to exactly 100%. Current total: ${totalWeight}%`);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          <span>Platform & Scoring Configuration</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure transparent deterministic scoring weights and view AI LLM provider integration.
        </p>
      </div>

      {/* Scoring Weight Customizer Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Configurable Deterministic Match Weights</span>
            </h2>
            <p className="text-xs text-slate-400">Must sum to 100%. Applied dynamically across candidate ranking calculations.</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            totalWeight === 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            Total Weight: {totalWeight}%
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Skills Match Coverage Weight</span>
              <span className="text-emerald-400 font-bold">{weights.skills}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.skills}
              onChange={(e) => setWeights({ ...weights, skills: Number(e.target.value) })}
              className="w-full cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Professional Experience Weight</span>
              <span className="text-indigo-400 font-bold">{weights.experience}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={weights.experience}
              onChange={(e) => setWeights({ ...weights, experience: Number(e.target.value) })}
              className="w-full cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>LLM Semantic Job Fit Assessment Weight</span>
              <span className="text-purple-400 font-bold">{weights.semantic_fit}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={weights.semantic_fit}
              onChange={(e) => setWeights({ ...weights, semantic_fit: Number(e.target.value) })}
              className="w-full cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Project Relevance Weight</span>
              <span className="text-amber-400 font-bold">{weights.projects}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={weights.projects}
              onChange={(e) => setWeights({ ...weights, projects: Number(e.target.value) })}
              className="w-full cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Education Alignment Weight</span>
              <span className="text-cyan-400 font-bold">{weights.education}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={weights.education}
              onChange={(e) => setWeights({ ...weights, education: Number(e.target.value) })}
              className="w-full cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Certifications Fit Weight</span>
              <span className="text-pink-400 font-bold">{weights.certifications}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={weights.certifications}
              onChange={(e) => setWeights({ ...weights, certifications: Number(e.target.value) })}
              className="w-full cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {saved && (
          <div role="status" className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
            Default scoring weights saved locally. For project-specific ranking recalculations, configure weights directly within the target Project Workspace.
          </div>
        )}

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Default Preset</span>
        </button>
      </div>

      {/* AI LLM Provider Information Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>LLM Provider Integration & Abstraction Layer</span>
        </h2>
        <p className="text-xs text-slate-400">
          The backend connects to standard OpenAI / OpenRouter / Anthropic compatible HTTP JSON APIs configured via environment variables. API keys remain strictly backend-only.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 font-medium">Scoring Algorithm Version</span>
            <div className="text-sm font-bold text-white mt-1">v1.0 (Deterministic Hybrid)</div>
          </div>
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 font-medium">Fallback Engine</span>
            <div className="text-sm font-bold text-emerald-400 mt-1">Rule-Based TF-IDF Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};
