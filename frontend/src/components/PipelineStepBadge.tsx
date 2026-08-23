import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface PipelineStepBadgeProps {
  state: string;
}

export const PipelineStepBadge: React.FC<PipelineStepBadgeProps> = ({ state }) => {
  if (state === 'COMPLETED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Screened</span>
      </span>
    );
  }

  if (state === 'FAILED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Failed</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span>{state.replace(/_/g, ' ')}</span>
    </span>
  );
};
