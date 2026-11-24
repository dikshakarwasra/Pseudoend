import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Layers, 
  Network, 
  Server, 
  Activity, 
  History, 
  ArrowRight, 
  Plus, 
  FileUp, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Play,
  Key
} from 'lucide-react';
import { Project, MockRoute, EnvironmentType, User } from '../types.js';

interface DashboardViewProps {
  user: User;
  activeProject: Project | null;
  routes: MockRoute[];
  activeEnvironment: EnvironmentType;
  apiBaseUrl: string;
  token: string;
  onNavigate: (tab: any) => void;
  onOpenNewRoute: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  activeProject,
  routes,
  activeEnvironment,
  apiBaseUrl,
  token,
  onNavigate,
  onOpenNewRoute
}) => {
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [latestReport, setLatestReport] = useState<any>(null);

  useEffect(() => {
    if (!activeProject) return;

    fetch(`${apiBaseUrl}/api/logs/${activeProject.id}?env=${activeEnvironment}&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(d => setRecentLogs(d.logs || []))
      .catch(() => {});

    fetch(`${apiBaseUrl}/api/testing/${activeProject.id}/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : { reports: [] })
      .then(d => {
        if (d.reports && d.reports.length > 0) setLatestReport(d.reports[0]);
      })
      .catch(() => {});
  }, [activeProject, activeEnvironment]);

  const healthScore = latestReport 
    ? Math.round((latestReport.passed / (latestReport.totalTests || 1)) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
            Pseudoend Platform 2.0
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">
            Welcome, {user.email.split('@')[0]}
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Your active project <strong className="text-slate-200">{activeProject?.name || 'Default Project'}</strong> is running in the <strong className="text-emerald-400 uppercase font-mono">{activeEnvironment}</strong> environment.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={onOpenNewRoute}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Mock Route</span>
            </button>
            <button
              onClick={() => onNavigate('import')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Import OpenAPI</span>
            </button>
            <button
              onClick={() => onNavigate('testing')}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span>Run Health Check</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('studio')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer transition-colors backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Mock Endpoints</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{routes.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Configured routes</div>
        </div>

        <div 
          onClick={() => onNavigate('environments')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer transition-colors backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Environment</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 uppercase mt-0.5">{activeEnvironment}</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero cross-bleed isolation</div>
        </div>

        <div 
          onClick={() => onNavigate('testing')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer transition-colors backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">API Health Score</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{healthScore}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {latestReport ? `${latestReport.passed}/${latestReport.totalTests} tests passed` : 'No test runs yet'}
          </div>
        </div>

        <div 
          onClick={() => onNavigate('relationships')}
          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer transition-colors backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Data Relationships</span>
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">Smart Graph</div>
          <div className="text-[11px] text-slate-500 mt-1">1:1 & 1:N foreign keys</div>
        </div>
      </div>

      {/* Two Column Layout: Workflow + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Guide */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Pseudoend End-to-End Developer Workflow
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">GENERATE &rarr; SIMULATE &rarr; TEST &rarr; TIME-TRAVEL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div 
              onClick={() => onNavigate('import')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2 text-white font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Import or Generate APIs</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Upload your Swagger or OpenAPI specification or create endpoints in Mock Studio.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('relationships')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2 text-white font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Connect Relationships</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auto-detect 1:1 and 1:N relations and seed realistic interconnected data.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('environments')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2 text-white font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Switch Environments</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Isolate states across Sandbox, Dev, Staging, and Live with custom chaos profiles.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('timetravel')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-2 text-white font-semibold mb-1">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold">4</span>
                <span>Time-Travel & Replay</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Capture snapshots, restore previous states, and replay historical API requests.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Request Feed */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Live Activity Feed</h3>
              <button 
                onClick={() => onNavigate('timetravel')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
              >
                View all &rarr;
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 font-mono">No requests logged yet.</p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className={`font-bold ${log.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{log.endpoint}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span>{log.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
