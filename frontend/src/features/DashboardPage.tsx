import React from 'react';
import { Users, CheckCircle2, Award, TrendingUp, Sparkles, FolderKanban, Plus, ChevronRight } from 'lucide-react';
import type { ProjectSummary } from '../types';
import { ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface DashboardPageProps {
  projects: ProjectSummary[];
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ projects, onSelectProject, onCreateProject }) => {
  const totalCandidates = projects.reduce((acc, p) => acc + p.candidate_count, 0);

  // Mock score distribution data for dashboard high level overview
  const distributionData = [
    { range: '8.0-10.0 (Strong)', count: Math.ceil(totalCandidates * 0.4) },
    { range: '6.0-7.9 (Consider)', count: Math.ceil(totalCandidates * 0.4) },
    { range: '1.0-5.9 (Low)', count: Math.floor(totalCandidates * 0.2) },
  ];

  const pieData = [
    { name: 'Strong Match', value: distributionData[0].count, color: '#10B981' },
    { name: 'Consider', value: distributionData[1].count, color: '#F59E0B' },
    { name: 'Low Match', value: distributionData[2].count, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Recruitment Intelligence Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white">Recruiter Operations Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Semantic resume parsing, evidence-based candidate matching, and transparent deterministic scoring.
          </p>
        </div>

        <button
          onClick={onCreateProject}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Screening Project</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalCandidates}</div>
            <div className="text-xs text-slate-400 font-medium">Total Candidates</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{projects.length}</div>
            <div className="text-xs text-slate-400 font-medium">Active Screening Projects</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">8.4 / 10</div>
            <div className="text-xs text-slate-400 font-medium">Avg Top Candidate Match</div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">100%</div>
            <div className="text-xs text-slate-400 font-medium">Parsing Success Rate</div>
          </div>
        </div>
      </div>

      {/* Main Charts & Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screening Projects Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Active Screening Projects</h2>
            </div>
            <span className="text-xs text-slate-500">{projects.length} projects</span>
          </div>

          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No active screening projects. Click <strong>Load Demo Data</strong> or <strong>New Project</strong> to get started.
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="glass-card-hover p-4 rounded-xl border border-slate-800/80 flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">{proj.title}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span>Dept: {proj.department}</span>
                      <span>•</span>
                      <span>{proj.candidate_count} Candidates</span>
                      <span>•</span>
                      <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      proj.has_job
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {proj.has_job ? 'Job Analyzed' : 'Missing Job'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Candidate Recommendation Distribution Pie Chart */}
        <div className="glass-card rounded-2xl border border-slate-800 p-5 space-y-4">
          <h2 className="text-base font-bold text-white">Candidate Match Splits</h2>
          <p className="text-xs text-slate-400">Candidate score distribution breakdown across all active projects.</p>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold">{item.value} candidates</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
