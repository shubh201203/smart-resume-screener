import React, { useState } from 'react';
import { Search, ArrowUpDown, Eye, Columns } from 'lucide-react';
import type { CandidateSummary } from '../types';
import { ScoreWheel } from './ScoreWheel';
import { QualityBadge } from './QualityBadge';

interface CandidateTableProps {
  candidates: CandidateSummary[];
  onSelectCandidate: (id: string) => void;
  onCompareSelected: (selectedIds: string[]) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  onSelectCandidate,
  onCompareSelected,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'exp' | 'name'>('score');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareWarning, setCompareWarning] = useState<string | null>(null);

  const toggleSelectCompare = (id: string) => {
    setCompareWarning(null);
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((i) => i !== id));
    } else {
      if (selectedForCompare.length >= 3) {
        setCompareWarning('Maximum 3 candidates can be selected simultaneously for side-by-side comparison.');
        setTimeout(() => setCompareWarning(null), 4000);
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  // Filter candidates
  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.matched_skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRec =
      recommendationFilter === 'ALL' ||
      c.recommendation.toUpperCase().replace(/\s+/g, '_') === recommendationFilter;

    const matchesStatus =
      statusFilter === 'ALL' || c.action_status === statusFilter;

    return matchesSearch && matchesRec && matchesStatus;
  });

  // Sort candidates
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.overall_score || 0) - (a.overall_score || 0);
    }
    if (sortBy === 'exp') {
      return b.total_years_experience - a.total_years_experience;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Recommendation Filter */}
          <select
            value={recommendationFilter}
            onChange={(e) => setRecommendationFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Matches</option>
            <option value="STRONG_MATCH">Strong Match (8.0+)</option>
            <option value="CONSIDER">Consider (6.0-7.9)</option>
            <option value="LOW_MATCH">Low Match (&lt;6.0)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Sort By */}
          <button
            onClick={() => {
              if (sortBy === 'score') setSortBy('exp');
              else if (sortBy === 'exp') setSortBy('name');
              else setSortBy('score');
            }}
            className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize">Sort: {sortBy}</span>
          </button>

          {/* Comparison Trigger */}
          {selectedForCompare.length > 0 && (
            <button
              onClick={() => onCompareSelected(selectedForCompare)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Compare ({selectedForCompare.length}/3)</span>
            </button>
          )}
        </div>
      </div>

      {compareWarning && (
        <div role="alert" className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-medium flex items-center justify-between">
          <span>{compareWarning}</span>
          <button onClick={() => setCompareWarning(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* Candidate Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4 w-10 text-center">Compare</th>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Candidate Profile</th>
              <th className="py-3 px-4 text-center">Match Score</th>
              <th className="py-3 px-4">Recommendation</th>
              <th className="py-3 px-4">Exp (Yrs)</th>
              <th className="py-3 px-4">Top Skills</th>
              <th className="py-3 px-4">Missing Skills</th>
              <th className="py-3 px-4">Quality</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 italic">
                  No candidates match the specified filter parameters.
                </td>
              </tr>
            ) : (
              sorted.map((candidate, index) => {
                const isSelected = selectedForCompare.includes(candidate.id);
                return (
                  <tr
                    key={candidate.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectCompare(candidate.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-400">#{index + 1}</td>
                    <td className="py-3 px-4">
                      <div
                        className="cursor-pointer hover:text-indigo-400 transition-colors"
                        onClick={() => onSelectCandidate(candidate.id)}
                      >
                        <div className="font-semibold text-slate-200 text-sm">{candidate.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {candidate.email || candidate.location || 'Resume Extracted'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ScoreWheel score={candidate.overall_score} size="sm" showLabel={false} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          candidate.overall_score && candidate.overall_score >= 8.0
                            ? 'badge-strong'
                            : candidate.overall_score && candidate.overall_score >= 6.0
                            ? 'badge-consider'
                            : 'badge-low'
                        }`}
                      >
                        {candidate.recommendation}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {candidate.total_years_experience.toFixed(1)} yrs
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {candidate.matched_skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {candidate.missing_skills.slice(0, 2).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <QualityBadge label={candidate.resume_quality} />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={candidate.action_status}
                        onChange={(e) => onStatusChange(candidate.id, e.target.value)}
                        className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${
                          candidate.action_status === 'SHORTLISTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : candidate.action_status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="UNDER_REVIEW">Review</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCandidate(candidate.id)}
                        className="inline-flex items-center space-x-1 p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition-colors cursor-pointer"
                        title="View Candidate Analysis"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-semibold text-[11px]">Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
