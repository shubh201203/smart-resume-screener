import React from 'react';

interface ScoreWheelProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreWheel: React.FC<ScoreWheelProps> = ({ score, size = 'md', showLabel = true }) => {
  if (score === null || score === undefined) {
    return <span className="text-xs text-slate-500 italic">Pending</span>;
  }

  const normalizedScore = Math.min(10, Math.max(1, score));
  const percentage = (normalizedScore / 10) * 100;

  // Determine Stroke Colors
  let strokeColor = '#10B981'; // Emerald
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  if (score < 6.0) {
    strokeColor = '#EF4444'; // Red
    badgeBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  } else if (score < 8.0) {
    strokeColor = '#F59E0B'; // Amber
    badgeBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  }

  // Dimension settings
  const config = {
    sm: { radius: 18, strokeWidth: 3.5, svgSize: 44, textClass: 'text-xs font-bold' },
    md: { radius: 28, strokeWidth: 5, svgSize: 68, textClass: 'text-base font-extrabold' },
    lg: { radius: 44, strokeWidth: 7, svgSize: 104, textClass: 'text-2xl font-black' },
  }[size];

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: config.svgSize, height: config.svgSize }}>
        <svg width={config.svgSize} height={config.svgSize} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={config.svgSize / 2}
            cy={config.svgSize / 2}
            r={config.radius}
            stroke="#1E293B"
            strokeWidth={config.strokeWidth}
            fill="transparent"
          />
          {/* Gauge stroke */}
          <circle
            cx={config.svgSize / 2}
            cy={config.svgSize / 2}
            r={config.radius}
            stroke={strokeColor}
            strokeWidth={config.strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        <span className={`absolute ${config.textClass} text-white`}>
          {normalizedScore.toFixed(1)}
        </span>
      </div>
      {showLabel && size !== 'sm' && (
        <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${badgeBg}`}>
          {score >= 8.0 ? 'Strong Match' : score >= 6.0 ? 'Consider' : 'Low Match'}
        </span>
      )}
    </div>
  );
};
