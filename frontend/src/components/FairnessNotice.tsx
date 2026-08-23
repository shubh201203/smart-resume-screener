import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const FairnessNotice: React.FC = () => {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-400 my-4">
      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <span className="font-semibold text-slate-300">Ethical & Bias-Free AI Guardrail:</span> AI recommendations are decision-support signals and should not replace human hiring judgment. The system excludes protected characteristics (gender, race, age, religion, photo) and evaluates candidates strictly on job-relevant skills, experience, and project evidence.
      </div>
    </div>
  );
};
