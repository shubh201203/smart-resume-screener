import React from 'react';
import { FileCheck } from 'lucide-react';

interface QualityBadgeProps {
  label: string;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({ label }) => {
  let style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (label === 'Needs Review') style = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (label === 'Poor') style = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  return (
    <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <FileCheck className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
};
