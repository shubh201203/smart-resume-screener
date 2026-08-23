import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { AnalyticsData, ProjectSummary } from '../types';
import { api } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface AnalyticsPageProps {
  projects: ProjectSummary[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProjectId) return;
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.getAnalytics(selectedProjectId);
        setAnalytics(data);
      } catch (err: any) {
        alert(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [selectedProjectId]);

  return (
    <div className="space-y-6">
      {/* Header & Project Selector */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Skill Gap & Coverage Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated metrics for candidate technology alignment, coverage percentages, and most frequent skill gaps.
          </p>
        </div>

        {/* Selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.candidate_count} Candidates)
            </option>
          ))}
        </select>
      </div>

      {loading || !analytics ? (
        <div className="py-20 text-center text-slate-400">Loading project analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Coverage Bar Chart */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Candidate Skill Coverage (%)</span>
            </h2>
            <p className="text-xs text-slate-400">Percentage of screened candidates demonstrating each required skill.</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.candidate_skill_coverage} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={11} />
                  <YAxis type="category" dataKey="skill" stroke="#94A3B8" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}% Coverage`, 'Coverage']}
                  />
                  <Bar dataKey="coverage_pct" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Common Missing Skill Gaps */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Most Common Missing Skill Gaps</span>
            </h2>
            <p className="text-xs text-slate-400">Frequently missing technologies across candidate submissions.</p>

            <div className="space-y-3 pt-2">
              {analytics.common_missing_gaps.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No missing skill gaps detected.</p>
              ) : (
                analytics.common_missing_gaps.map((gap, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{gap.skill}</span>
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                      Absent on {gap.gap_count} resumes
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
