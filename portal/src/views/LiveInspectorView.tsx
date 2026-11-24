import React, { useState } from 'react';
import { Play, Activity } from 'lucide-react';
import { Project } from '../types.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';

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
        'x-pseudoend-key': activeProject.apiKey || activeProject.apiKeyHash || activeProject.rawApiKeyPrefix || '',
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
      <div className="bg-white p-5 rounded-2xl border border-black/[0.05] shadow-apple-sm">
        <div className="text-xs font-semibold text-[#86868b] mb-3 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#2997ff]" />
          <span>Interactive Live Request Runner</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <select
            value={testMethod}
            onChange={(e) => setTestMethod(e.target.value)}
            className="bg-white border border-[#d2d2d7] rounded-xl px-3 py-2 text-xs font-mono font-semibold text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
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
            className="flex-1 bg-white border border-[#d2d2d7] rounded-xl px-3.5 py-2 text-xs font-mono text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />

          <Button
            variant="primary"
            size="sm"
            loading={loading}
            icon={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={handleExecute}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </div>

      {/* Two Column Log Inspector */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Left: Stream of Requests */}
        <div className="bg-white border border-black/[0.05] rounded-2xl overflow-hidden shadow-apple-sm">
          <div className="p-3.5 border-b border-[#d2d2d7]/50 bg-[#fbfbfd] flex items-center justify-between text-xs text-[#6e6e73]">
            <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Request History</span>
            <span className="text-[11px] font-mono">{logs.length} requests</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[460px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`p-3.5 text-xs cursor-pointer transition-colors flex items-center justify-between ${selectedLog?.id === log.id ? 'bg-[#e8f2fc]/40' : 'hover:bg-black/[0.02]'
                  }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Badge statusCode={log.status} size="sm" />
                  <Badge method={log.method} size="sm" />
                  <span className="font-mono text-[#1d1d1f] truncate max-w-[200px]" title={log.url}>
                    {log.url.split('/mock/')[1] ? '/' + log.url.split('/mock/')[1].split('/').slice(1).join('/') : log.url}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-[#86868b] font-mono">
                  <span>{log.durationMs}ms</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Response Inspector */}
        <div className="bg-white border border-black/[0.05] rounded-2xl overflow-hidden flex flex-col shadow-apple-sm">
          <div className="p-3.5 border-b border-[#d2d2d7]/50 bg-[#fbfbfd] flex items-center justify-between text-xs text-[#6e6e73]">
            <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Response Inspector</span>
            {selectedLog && (
              <span className="font-mono text-[#2997ff] text-xs">
                {selectedLog.status} OK • {selectedLog.durationMs}ms
              </span>
            )}
          </div>
          <div className="p-4 flex-1 bg-[#000000] font-mono text-xs overflow-auto max-h-[460px] leading-relaxed">
            {selectedLog ? (
              <pre className="text-[#1d1d1f]">
                {JSON.stringify(selectedLog.response, null, 2)}
              </pre>
            ) : (
              <div className="text-[#86868b] text-center py-12">
                Select a request on the left to inspect its headers and payload.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
