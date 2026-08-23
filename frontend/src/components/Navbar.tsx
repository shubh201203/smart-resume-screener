import React, { useState } from 'react';
import { Brain, Layers, BarChart3, Settings as SettingsIcon, CheckCircle2, Sparkles, PlusCircle, Home } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onDemoLoaded: (projectId: string) => void;
  onCreateProjectClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onDemoLoaded,
  onCreateProjectClick,
}) => {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      const res = await api.loadDemoData();
      setDemoSuccess(true);
      setTimeout(() => setDemoSuccess(false), 3000);
      onDemoLoaded(res.project_id);
    } catch (err: any) {
      alert(`Failed to load demo data: ${err.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'projects', label: 'Screening Projects', icon: Brain },
    { id: 'analytics', label: 'Skill Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">SmartResume AI</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Enterprise v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI Recruitment Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onCreateProjectClick}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-sm font-medium text-slate-200 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">New Project</span>
          </button>

          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md ${
              demoSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
            }`}
          >
            {loadingDemo ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : demoSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loadingDemo ? 'Seeding Demo...' : demoSuccess ? 'Demo Loaded!' : 'Try Demo'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
