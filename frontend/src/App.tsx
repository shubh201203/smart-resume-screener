import React, { useState, useEffect } from 'react';
import type { ProjectSummary } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './features/DashboardPage';
import { ProjectPage } from './features/ProjectPage';
import { CandidateDetailPage } from './features/CandidateDetailPage';
import { AnalyticsPage } from './features/AnalyticsPage';
import { SettingsPage } from './features/SettingsPage';
import { PlusCircle, X } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  // New Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (err: any) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDemoLoaded = (projectId: string) => {
    loadProjects();
    setSelectedProjectId(projectId);
    setSelectedCandidateId(null);
    setCurrentTab('projects');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const res = await api.createProject(newTitle, newDept || 'Engineering');
      setNewTitle('');
      setNewDept('');
      setShowCreateModal(false);
      await loadProjects();
      setSelectedProjectId(res.id);
      setCurrentTab('projects');
    } catch (err: any) {
      alert(`Project creation failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* SaaS Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'dashboard' || tab === 'home') {
            setSelectedProjectId(null);
            setSelectedCandidateId(null);
          }
        }}
        onDemoLoaded={handleDemoLoaded}
        onCreateProjectClick={() => setShowCreateModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {selectedCandidateId ? (
          <CandidateDetailPage
            candidateId={selectedCandidateId}
            onBack={() => setSelectedCandidateId(null)}
          />
        ) : selectedProjectId ? (
          <ProjectPage
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
            onSelectCandidate={(id) => setSelectedCandidateId(id)}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <LandingPage
                onStartScreening={() => setCurrentTab('dashboard')}
                onDemoLoaded={handleDemoLoaded}
              />
            )}
            {currentTab === 'dashboard' && (
              <DashboardPage
                projects={projects}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                  setCurrentTab('projects');
                }}
                onCreateProject={() => setShowCreateModal(true)}
              />
            )}
            {currentTab === 'projects' && (
              <DashboardPage
                projects={projects}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                }}
                onCreateProject={() => setShowCreateModal(true)}
              />
            )}
            {currentTab === 'analytics' && <AnalyticsPage projects={projects} />}
            {currentTab === 'settings' && <SettingsPage />}
          </>
        )}
      </main>

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <span>Create Screening Project</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering / Product"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500">
        SmartResume AI Platform • Powered by Hybrid AI & Deterministic Match Scoring Engine
      </footer>
    </div>
  );
}

export default App;
