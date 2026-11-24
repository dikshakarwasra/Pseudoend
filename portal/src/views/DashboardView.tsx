import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Network, 
  Server, 
  Activity, 
  History, 
  Plus, 
  FileUp, 
  Play, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ChevronRight
} from 'lucide-react';
import { Project, MockRoute, EnvironmentType, User } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';

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
      {/* Welcome Hero Banner — Apple styling */}
      <div className="bg-[#161617] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-apple-sm relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#a1a1a6] bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-3">
            <span>Project</span>
            <span className="text-[#86868b]">&bull;</span>
            <span className="text-white font-medium">{activeProject?.name || 'Default Project'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-[#f5f5f7] tracking-tight">
            Developer Studio
          </h2>
          <p className="text-xs sm:text-sm text-[#a1a1a6] mt-2 leading-relaxed">
            Running in the <strong className="text-[#2997ff] uppercase font-mono">{activeEnvironment}</strong> environment. Configure mock routes, generate relational schemas, simulate latency, and test live frontend components.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={onOpenNewRoute}
            >
              New Mock Route
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<FileUp className="w-4 h-4 text-[#bf5af2]" />}
              onClick={() => onNavigate('import')}
            >
              Import OpenAPI
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Play className="w-4 h-4 text-[#2997ff] fill-current" />}
              onClick={() => onNavigate('testing')}
            >
              Run Health Check
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards — Apple style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('studio')}
          className="bg-[#161617] hover:bg-[#1c1c1e] border border-white/10 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition-all shadow-apple-sm group"
        >
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Mock Endpoints</span>
            <Layers className="w-4 h-4 text-[#2997ff] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">{routes.length}</div>
          <div className="text-[11px] text-[#86868b] mt-1 flex items-center justify-between">
            <span>Configured routes</span>
            <span className="text-[#2997ff] text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
              Studio <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('environments')}
          className="bg-[#161617] hover:bg-[#1c1c1e] border border-white/10 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition-all shadow-apple-sm group"
        >
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Active Environment</span>
            <Server className="w-4 h-4 text-[#64d2ff] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold font-mono text-[#2997ff] uppercase tracking-tight">{activeEnvironment}</div>
          <div className="text-[11px] text-[#86868b] mt-1 flex items-center justify-between">
            <span>Zero data cross-bleed</span>
            <span className="text-[#64d2ff] text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
              Switch <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('testing')}
          className="bg-[#161617] hover:bg-[#1c1c1e] border border-white/10 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition-all shadow-apple-sm group"
        >
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">API Health Score</span>
            <Activity className="w-4 h-4 text-[#30d158] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#30d158] tracking-tight">{healthScore}%</div>
          <div className="text-[11px] text-[#86868b] mt-1 flex items-center justify-between">
            <span>{latestReport ? `${latestReport.passed}/${latestReport.totalTests} tests passed` : 'No runs yet'}</span>
            <span className="text-[#30d158] text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
              Test <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('relationships')}
          className="bg-[#161617] hover:bg-[#1c1c1e] border border-white/10 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition-all shadow-apple-sm group"
        >
          <div className="flex items-center justify-between text-[#86868b] mb-2">
            <span className="text-xs font-medium">Data Relationships</span>
            <Network className="w-4 h-4 text-[#bf5af2] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-[#bf5af2] tracking-tight">Smart Graph</div>
          <div className="text-[11px] text-[#86868b] mt-1 flex items-center justify-between">
            <span>1:1 & 1:N foreign keys</span>
            <span className="text-[#bf5af2] text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
              Graph <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Workflow Stepper + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workflow Guide (2 cols) */}
        <div className="lg:col-span-2 bg-[#161617] border border-white/10 rounded-3xl p-6 shadow-apple-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider font-mono">
              Pseudoend End-to-End Workflow
            </h3>
            <span className="text-[11px] text-[#2997ff] font-mono font-medium">
              GENERATE &bull; RELATE &bull; SIMULATE &bull; REPLAY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div 
              onClick={() => onNavigate('import')}
              className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-white font-medium mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#0071e3]/20 text-[#2997ff] flex items-center justify-center text-[10px] font-bold font-mono">1</span>
                <span className="group-hover:text-[#2997ff] transition-colors">Import or Generate APIs</span>
              </div>
              <p className="text-[11px] text-[#a1a1a6] leading-relaxed">
                Upload your OpenAPI / Swagger schema or build custom mock endpoints in Mock Studio.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('relationships')}
              className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-white font-medium mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#bf5af2]/20 text-[#bf5af2] flex items-center justify-center text-[10px] font-bold font-mono">2</span>
                <span className="group-hover:text-[#bf5af2] transition-colors">Connect Relationships</span>
              </div>
              <p className="text-[11px] text-[#a1a1a6] leading-relaxed">
                Auto-detect 1:1 and 1:N connections and seed realistic referential data across entities.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('environments')}
              className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-white font-medium mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#64d2ff]/20 text-[#64d2ff] flex items-center justify-center text-[10px] font-bold font-mono">3</span>
                <span className="group-hover:text-[#64d2ff] transition-colors">Switch Environments</span>
              </div>
              <p className="text-[11px] text-[#a1a1a6] leading-relaxed">
                Isolate states across Sandbox, Dev, Staging, and Live with custom chaos fault injection.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('timetravel')}
              className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-white font-medium mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#ff9f0a]/20 text-[#ff9f0a] flex items-center justify-center text-[10px] font-bold font-mono">4</span>
                <span className="group-hover:text-[#ff9f0a] transition-colors">Time-Travel & Replay</span>
              </div>
              <p className="text-[11px] text-[#a1a1a6] leading-relaxed">
                Capture checkpoints, compute diffs, restore states, and replay recorded API requests.
              </p>
            </div>
          </div>
        </div>

        {/* Live Activity Feed (1 col) */}
        <div className="bg-[#161617] border border-white/10 rounded-3xl p-6 shadow-apple-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider font-mono">
                Recent Activity
              </h3>
              <button 
                onClick={() => onNavigate('timetravel')}
                className="text-[11px] text-[#2997ff] hover:text-[#0077ed] font-medium transition-colors"
              >
                View all &rarr;
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#86868b] font-mono">
                No requests recorded in this environment yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="bg-[#1c1c1e] p-3 rounded-2xl border border-white/5 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <Badge method={log.method} size="sm" />
                      <Badge statusCode={log.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-[#d2d2d7] truncate" title={log.endpoint}>
                      {log.endpoint}
                    </div>
                    <div className="text-[10px] text-[#86868b] mt-1 flex justify-between">
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
