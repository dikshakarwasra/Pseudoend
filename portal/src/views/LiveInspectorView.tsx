import React, { useState } from 'react';
import { Play, Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Project } from '../types.js';

interface LiveInspectorViewProps {
  activeProject: Project | null;
  apiBaseUrl: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  response: any;
}

export const LiveInspectorView: React.FC<LiveInspectorViewProps> = ({ activeProject, apiBaseUrl }) => {
  const [testMethod, setTestMethod] = useState('GET');
  const [testPath, setTestPath] = useState('/api/v1/users');
  const [testBody, setTestBody] = useState('{\n  "test": true\n}');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      method: 'GET',
      url: `/mock/${activeProject?.id || 'proj_demo'}/api/v1/users`,
      status: 200,
      durationMs: 142,
      response: {
        status: 'success',
        users: [{ id: 'usr_1', name: 'Sample User', email: 'demo@example.com' }]
      }
    }
  ]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(logs[0]);

  const handleExecute = async () => {
    if (!activeProject) return;
    setLoading(true);

    const fullUrl = `${apiBaseUrl}/mock/${activeProject.id}${testPath.startsWith('/') ? testPath : '/' + testPath}`;
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {
        'x-sudoend-key': activeProject.apiKey || activeProject.rawApiKeyPrefix || '',
        'Content-Type': 'application/json'
      };

      const options: RequestInit = {
        method: testMethod,
        headers
      };

      if (['POST', 'PUT', 'PATCH'].includes(testMethod)) {
        options.body = testBody;
      }

      const res = await fetch(fullUrl, options);
      const durationMs = Math.round(performance.now() - startTime);
      let responseData: any;
      try {
        responseData = await res.json();
      } catch {
        responseData = await res.text();
      }

      const newEntry: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        method: testMethod,
        url: fullUrl,
        status: res.status,
        durationMs,
        response: responseData
      };

      setLogs((prev) => [newEntry, ...prev.slice(0, 19)]);
      setSelectedLog(newEntry);
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorEntry: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        method: testMethod,
        url: fullUrl,
        status: 0,
        durationMs,
        response: { error: err.message }
      };
      setLogs((prev) => [errorEntry, ...prev]);
      setSelectedLog(errorEntry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Request Runner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Interactive Request Runner</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={testMethod}
            onChange={(e) => setTestMethod(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={testPath}
            onChange={(e) => setTestPath(e.target.value)}
            placeholder="/api/v1/users"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
          />

          <button
            onClick={handleExecute}
            disabled={loading}
            className="bg-emerald-400 hover:bg-emerald-300 text-black px-5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>
      </div>

      {/* Two Column Log Inspector */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Stream of Requests */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider font-mono text-[11px]">Request History</span>
            <span className="text-[11px] font-mono">{logs.length} requests</span>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                  selectedLog?.id === log.id ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    log.status >= 200 && log.status < 300
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {log.status || 'ERR'}
                  </span>
                  <span className="font-mono text-slate-400 font-bold">{log.method}</span>
                  <span className="font-mono text-slate-200 truncate max-w-[200px]" title={log.url}>
                    {log.url.split('/mock/')[1] ? '/' + log.url.split('/mock/')[1].split('/').slice(1).join('/') : log.url}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                  <span>{log.durationMs}ms</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Response Inspector */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider font-mono text-[11px]">Response Inspector</span>
            {selectedLog && (
              <span className="font-mono text-emerald-400 text-xs">
                {selectedLog.status} OK • {selectedLog.durationMs}ms
              </span>
            )}
          </div>
          <div className="p-4 flex-1 bg-slate-950 font-mono text-xs overflow-auto max-h-[460px]">
            {selectedLog ? (
              <pre className="text-emerald-300">
                {JSON.stringify(selectedLog.response, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500 text-center py-12">
                Select a request on the left to inspect its headers and payload.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

