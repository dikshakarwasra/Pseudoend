import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Network, 
  Server, 
  Activity, 
  Plus, 
  FileUp, 
  Play, 
  ChevronRight,
  ArrowRight
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
    <div className="space-y-7">
      {/* Apple Store Style Section Heading & Hero */}
      <div className="bg-white p-7 sm:p-9 rounded-[32px] border border-black/[0.04] shadow-apple-card relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="text-xs font-bold text-[#b62645] uppercase tracking-wider mb-2 font-mono">
            Only at Pseudoend. Instant Prototyping.
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
            Developer Studio
          </h2>
          <p className="text-xs sm:text-sm text-[#6e6e73] mt-2.5 leading-relaxed">
            Running in the <strong className="text-[#0071e3] uppercase font-mono">{activeEnvironment}</strong> environment. Configure mock routes, generate relational schemas, simulate latency, and test live frontend components.
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
              icon={<FileUp className="w-4 h-4 text-[#9333ea]" />}
              onClick={() => onNavigate('import')}
            >
              Import OpenAPI
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Play className="w-4 h-4 text-[#0071e3] fill-current" />}
              onClick={() => onNavigate('testing')}
            >
              Run Health Check
            </Button>
          </div>
        </div>
      </div>

      {/* Apple Store Style Pastel Bento Cards Row */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold text-[#1d1d1f]">
            <span className="text-[#b62645]">The latest.</span> Overview of your mock platform.
          </h3>
          <span className="text-xs text-[#86868b] font-medium hidden sm:inline">Real-time metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Soft Sky Blue Pastel */}
          <div 
            onClick={() => onNavigate('studio')}
            className="bg-[#e8f2fc] hover:bg-[#dbeafe] border border-[#d8e7f5] p-6 rounded-[28px] cursor-pointer transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[#0071e3] mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Mock Endpoints</span>
                <Layers className="w-5 h-5 text-[#0071e3] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#1d1d1f] tracking-tight">{routes.length}</div>
              <p className="text-xs text-[#515154] mt-1.5 leading-snug">Configured and active routes</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0071e3]">Open Studio</span>
              <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-[#1d1d1f]" />
              </div>
            </div>
          </div>

          {/* Card 2: Soft Warm Amber/Peach Pastel */}
          <div 
            onClick={() => onNavigate('environments')}
            className="bg-[#fef3d6] hover:bg-[#fde68a] border border-[#faecd5] p-6 rounded-[28px] cursor-pointer transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[#b45309] mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Environment</span>
                <Server className="w-5 h-5 text-[#b45309] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-extrabold font-mono text-[#1d1d1f] uppercase tracking-tight">{activeEnvironment}</div>
              <p className="text-xs text-[#515154] mt-1.5 leading-snug">Zero data cross-bleed isolation</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#b45309]">Switch Env</span>
              <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-[#1d1d1f]" />
              </div>
            </div>
          </div>

          {/* Card 3: Soft Mint/Sage Pastel */}
          <div 
            onClick={() => onNavigate('testing')}
            className="bg-[#e8f5ec] hover:bg-[#d1fae5] border border-[#d7ece0] p-6 rounded-[28px] cursor-pointer transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[#166534] mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Health Score</span>
                <Activity className="w-5 h-5 text-[#166534] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#1d1d1f] tracking-tight">{healthScore}%</div>
              <p className="text-xs text-[#515154] mt-1.5 leading-snug">
                {latestReport ? `${latestReport.passed}/${latestReport.totalTests} tests passed` : 'All endpoints ready'}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#166534]">Run Diagnostics</span>
              <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-[#1d1d1f]" />
              </div>
            </div>
          </div>

          {/* Card 4: Soft Lavender/Lilac Pastel */}
          <div 
            onClick={() => onNavigate('relationships')}
            className="bg-[#f1ecfd] hover:bg-[#ede9fe] border border-[#e6e0f8] p-6 rounded-[28px] cursor-pointer transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[#6b21a8] mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">Data Relations</span>
                <Network className="w-5 h-5 text-[#6b21a8] group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-extrabold text-[#1d1d1f] tracking-tight">Smart Graph</div>
              <p className="text-xs text-[#515154] mt-1.5 leading-snug">1:1 & 1:N foreign keys</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6b21a8]">View Schema</span>
              <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-[#1d1d1f]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Workflow Stepper + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workflow Guide (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-black/[0.04] rounded-[32px] p-7 shadow-apple-card space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#d2d2d7]/50">
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">
                Recommended Developer Workflow
              </h3>
              <p className="text-xs text-[#6e6e73] mt-0.5">Four steps from idea to interactive client prototype</p>
            </div>
            <span className="text-[11px] text-[#0071e3] font-mono font-bold px-2.5 py-1 rounded-full bg-[#0071e3]/10">
              END-TO-END
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div 
              onClick={() => onNavigate('import')}
              className="bg-[#fbfbfd] hover:bg-[#f5f5f7] p-5 rounded-2xl border border-[#d2d2d7]/60 hover:border-[#86868b] cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-[#1d1d1f] font-bold mb-1.5">
                <span className="w-6 h-6 rounded-full bg-[#e8f2fc] text-[#0071e3] flex items-center justify-center text-xs font-bold font-mono">1</span>
                <span className="group-hover:text-[#0071e3] transition-colors">Import or Generate APIs</span>
              </div>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Upload your OpenAPI / Swagger schema or build custom mock endpoints in Mock Studio.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('relationships')}
              className="bg-[#fbfbfd] hover:bg-[#f5f5f7] p-5 rounded-2xl border border-[#d2d2d7]/60 hover:border-[#86868b] cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-[#1d1d1f] font-bold mb-1.5">
                <span className="w-6 h-6 rounded-full bg-[#f1ecfd] text-[#6b21a8] flex items-center justify-center text-xs font-bold font-mono">2</span>
                <span className="group-hover:text-[#6b21a8] transition-colors">Connect Relationships</span>
              </div>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Auto-detect 1:1 and 1:N connections and seed realistic referential data across entities.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('environments')}
              className="bg-[#fbfbfd] hover:bg-[#f5f5f7] p-5 rounded-2xl border border-[#d2d2d7]/60 hover:border-[#86868b] cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-[#1d1d1f] font-bold mb-1.5">
                <span className="w-6 h-6 rounded-full bg-[#fef3d6] text-[#b45309] flex items-center justify-center text-xs font-bold font-mono">3</span>
                <span className="group-hover:text-[#b45309] transition-colors">Switch Environments</span>
              </div>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Isolate states across Sandbox, Dev, Staging, and Live with custom chaos fault injection.
              </p>
            </div>

            <div 
              onClick={() => onNavigate('timetravel')}
              className="bg-[#fbfbfd] hover:bg-[#f5f5f7] p-5 rounded-2xl border border-[#d2d2d7]/60 hover:border-[#86868b] cursor-pointer transition-all group"
            >
              <div className="flex items-center space-x-2.5 text-[#1d1d1f] font-bold mb-1.5">
                <span className="w-6 h-6 rounded-full bg-[#e8f5ec] text-[#166534] flex items-center justify-center text-xs font-bold font-mono">4</span>
                <span className="group-hover:text-[#166534] transition-colors">Time-Travel & Replay</span>
              </div>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Capture checkpoints, compute diffs, restore states, and replay recorded API requests.
              </p>
            </div>
          </div>
        </div>

        {/* Live Activity Feed (1 col) */}
        <div className="bg-white border border-black/[0.04] rounded-[32px] p-7 shadow-apple-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#d2d2d7]/50 mb-3.5">
              <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">
                Recent Traffic
              </h3>
              <button 
                onClick={() => onNavigate('timetravel')}
                className="text-xs text-[#0071e3] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#86868b] font-mono">
                No requests recorded in this environment yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLogs.map((log) => (
                  <div key={log.id} className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-[#d2d2d7]/50 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge method={log.method} size="sm" />
                      <Badge statusCode={log.status} size="sm" />
                    </div>
                    <div className="text-xs text-[#1d1d1f] font-semibold truncate" title={log.endpoint}>
                      {log.endpoint}
                    </div>
                    <div className="text-[11px] text-[#86868b] mt-1.5 flex justify-between font-sans">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="font-mono text-[#515154]">{log.durationMs}ms</span>
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
