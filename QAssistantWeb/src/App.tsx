import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { ProjectDialog } from "./components/ProjectDialog";
import { Button } from "./components/ui/Button";
import {
  Briefcase, CheckSquare, Settings, Database, Search,
  Terminal, Beaker, FileCode, Server, LayoutDashboard, FileText, Globe
} from "lucide-react";

import { TasksView } from "./views/TasksView";
import { TestsView } from "./views/TestsView";
import { TestDataView } from "./views/TestDataView";
import { ChecklistsView } from "./views/ChecklistsView";
import { SettingsView } from "./views/SettingsView";
import { LinksView } from "./views/LinksView";
import { NotesView } from "./views/NotesView";
import { FilesView } from "./views/FilesView";
import { EnvironmentsView } from "./views/EnvironmentsView";
import { DashboardView } from "./views/DashboardView";
import { ApiPlaygroundView } from "./views/ApiPlaygroundView";
import { SapView } from "./views/SapView";

const VIEWS = {
  dashboard: { name: "Dashboard", icon: LayoutDashboard, component: DashboardView },
  tasks: { name: "Tasks", icon: CheckSquare, component: TasksView },
  tests: { name: "Tests", icon: Beaker, component: TestsView },
  data: { name: "Test Data", icon: Database, component: TestDataView },
  checklists: { name: "Checklists", icon: FileText, component: ChecklistsView },
  env: { name: "Environments", icon: Server, component: EnvironmentsView },
  api: { name: "API Playground", icon: Terminal, component: ApiPlaygroundView },
  sap: { name: "SAP Tools", icon: Globe, component: SapView },
  links: { name: "Links", icon: FileCode, component: LinksView },
  notes: { name: "Notes", icon: FileText, component: NotesView },
  files: { name: "Files", icon: Briefcase, component: FilesView },
  settings: { name: "Settings", icon: Settings, component: SettingsView },
};

function AppShell() {
  const { projects, activeProject, setActiveProject } = useApp();
  const [currentView, setCurrentView] = useState<keyof typeof VIEWS>("tasks");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  const CurrentComponent = VIEWS[currentView].component;

  return (
    <div className="flex h-screen w-full bg-bg-base text-text-main overflow-hidden font-sans">

      {/* 1. Primary Sidebar: Projects */}
      <aside className="w-[200px] flex-shrink-0 bg-[#0f0f13] border-r border-[#1f1f22] flex flex-col pt-4">
        <h2 className="px-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mb-4">
          Projects
        </h2>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3 ${activeProject?.id === p.id
                ? "bg-[#252538] text-white font-medium"
                : "text-text-muted hover:bg-bg-surface-hover hover:text-white"
                }`}
            >
              <div
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: p.color || "var(--color-brand)" }}
              />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[#1f1f22]">
          <Button variant="surface" className="w-full text-xs text-text-muted hover:text-white" onClick={() => setIsProjectDialogOpen(true)}>
            + New Project
          </Button>
        </div>
      </aside>

      {/* 2. Secondary Sidebar: Tools/Navigation */}
      <aside className="w-64 flex-shrink-0 bg-[#141419] border-r border-[#1f1f22] flex flex-col pt-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">
            Tools
          </h2>
          <Button variant="ghost" size="icon" className="w-6 h-6 p-0 text-text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </Button>
        </div>

        {/* Inline Search */}
        <div className="px-4 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 bg-[#1a1a24] border border-[#2b2b36] rounded-md pl-9 pr-4 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-white placeholder-text-muted"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {/* Dashboard (Top level) */}
          <div className="space-y-1 mb-6">
            <Button
              variant="nav"
              className={`w-full justify-start text-sm ${currentView === 'dashboard' ? "bg-bg-surface-hover text-white font-medium" : "text-text-muted"}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <VIEWS.dashboard.icon className="w-4 h-4 mr-3" />
              {VIEWS.dashboard.name}
            </Button>
          </div>

          <h3 className="px-3 text-[9px] font-bold text-[#6b6b7b] uppercase tracking-[0.15em] mb-2 mt-2">Organization</h3>
          <div className="space-y-1 mb-6">
            {['links', 'notes', 'files'].map((key) => {
              const view = VIEWS[key as keyof typeof VIEWS];
              return (
                <Button
                  key={key} variant="nav"
                  className={`w-full justify-start text-sm ${currentView === key ? "bg-[#2b2b3c] text-white font-medium shadow-sm" : "text-text-muted"}`}
                  onClick={() => setCurrentView(key as keyof typeof VIEWS)}
                >
                  <view.icon className="w-4 h-4 mr-3 opacity-70" />
                  {view.name}
                </Button>
              )
            })}
          </div>

          <h3 className="px-3 text-[9px] font-bold text-[#6b6b7b] uppercase tracking-[0.15em] mb-2">QA Basic</h3>
          <div className="space-y-1 mb-6">
            {['tasks', 'tests', 'data', 'checklists'].map((key) => {
              const view = VIEWS[key as keyof typeof VIEWS];
              return (
                <Button
                  key={key} variant="nav"
                  className={`w-full justify-start text-sm ${currentView === key ? "bg-[#2b2b3c] text-white font-medium shadow-sm" : "text-text-muted"}`}
                  onClick={() => setCurrentView(key as keyof typeof VIEWS)}
                >
                  <view.icon className="w-4 h-4 mr-3 opacity-70" />
                  {view.name}
                </Button>
              )
            })}
          </div>

          <h3 className="px-3 text-[9px] font-bold text-[#6b6b7b] uppercase tracking-[0.15em] mb-2">QA Advanced</h3>
          <div className="space-y-1">
            {['env', 'api', 'sap'].map((key) => {
              const view = VIEWS[key as keyof typeof VIEWS];
              return (
                <Button
                  key={key} variant="nav"
                  className={`w-full justify-start text-sm ${currentView === key ? "bg-[#2b2b3c] text-white font-medium shadow-sm" : "text-text-muted"}`}
                  onClick={() => setCurrentView(key as keyof typeof VIEWS)}
                >
                  <view.icon className="w-4 h-4 mr-3 opacity-70" />
                  {view.name}
                </Button>
              )
            })}
          </div>
        </div>

      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-bg-base">
        <header className="h-14 border-b border-border-subtle flex items-center justify-between px-6 bg-bg-base/50 backdrop-blur-sm z-10 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = VIEWS[currentView].icon;
                return <Icon className="w-5 h-5 text-brand" />;
              })()}
              <h1 className="text-lg font-medium">{VIEWS[currentView].name}</h1>
            </div>
            {/* Context breadcrumb from active project */}
            {activeProject && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="text-border-subtle">/</span>
                <span className="px-2 py-0.5 rounded-md bg-bg-surface text-brand text-xs font-medium border border-[#2b2b36]">
                  {activeProject.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className={`hover:text-white ${currentView === 'settings' ? 'text-white bg-bg-surface' : 'text-text-muted'}`} onClick={() => setCurrentView('settings')} title="Settings">
              <Settings className="w-[18px] h-[18px]" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs text-white font-bold shadow-sm ring-1 ring-white/10 ml-2">
              S
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {activeProject ? (
            <CurrentComponent />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-text-muted">
              <Briefcase className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium text-white">No Project Selected</p>
              <p className="text-sm mt-2 max-w-sm text-center">Select a project from the sidebar or create a new one to get started.</p>
              <Button variant="brand" className="mt-6" onClick={() => setIsProjectDialogOpen(true)}>Create Project</Button>
            </div>
          )}
        </div>
      </main>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onSuccess={() => { /* Context handles refresh automatically if we use its hook, but let's wire it up if needed */ }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
